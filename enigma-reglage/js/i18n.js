// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// The values are this episode's own (r113: no slide has a worked example), computed by
// enigma-reglage/js/enigma.js and checked by tests/enigma-reglage_values.mjs, which also reads the
// figures written here: 5.1's O at AAA lights T (D K N K B J T); with the ten cables of the day
// (BS CZ DN ER FI GU HO KW LM QY) O enters at H and lights F (Q Q X J Z S I), F lights O back;
// with the right ring on B, O lights C (P C M O M O Z); from ADU, OUI gives SMK through ADV, AEW,
// BFX (the notch, then the double step); 60 × 17 576 × 150 738 274 937 250 settings.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Enigma, le vrai réglage — Crypto en visuel',
  title: 'Enigma, le vrai réglage',
  subtitle: 'Les câbles, les bagues, l’encoche et le double pas, cinq rotors : tout le réglage du jour, et combien il y en a.',
  loading: 'On branche les câbles…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  part: { entry: 'entrée', ref: 'réflecteur B' },
  notchWord: 'encoche', ringWord: 'bague',
  card: { title: 'Le trajet du courant', key: 'touche', from: 'départ', ref: 'réf', whose: { a: 'Machine d’Alice', b: 'Machine de Bob' },
    setup: 'rotors {r}', rings: 'bagues {g}', pos: 'position {p}', start: 'départ {p}', cables: 'câbles :', noCable: 'aucun',
    blank: 'Aucune touche encore.' },
  tally: { title: 'Combien de réglages ?', sub: { orders: 'les rotors et le départ', cables: 'dix câbles, un à la fois', total: 'tout multiplié' },
    orders: 'ordres des rotors', starts: 'départs', both: 'les deux', cable: 'câble', free: 'lettres libres', places: 'choix', ways: 'tableaux',
    cables10: 'tableaux à 10 câbles', total: 'réglages' },
  ch: ['Le réglage du jour', 'Les câbles', 'La bague', 'L’encoche', 'Le message', 'Combien de clés ?', 'La suite'],
  steps: {
    s1: { t: 'Le réglage du jour',
      p: "Alice doit encore répondre « OUI » à Bob, par radio, et Eve écoute toujours. Jusqu’ici, leur Enigma était simplifiée : aucun câble, les bagues sur A, et seul le rotor de droite tournait. La vraie machine se règle en quatre parties, écrites chaque jour sur une feuille : quels rotors et dans quel ordre, la bague de chaque rotor, les câbles du tableau de connexions, et la position de départ. Ajoutons-les une à une.",
      a: 'Aujourd’hui, je règle la machine comme les vrais opérateurs.', b: 'J’ai la même feuille qu’Alice : le même réglage.', e: 'Plus de pièces dans la machine… plus de choses que je ne sais pas.' },
    s2: { t: 'La machine nue',
      p: "D’abord, la machine telle qu’on l’a laissée : rotors I, II et III, réflecteur B, départ AAA, et rien d’autre. Alice appuie sur O : le rotor de droite avance en AAB, le courant suit D, K, N, le réflecteur, K, B, J, T, et la lampe T s’allume. Tout ce qu’on ajoute maintenant va changer ce chemin.",
      go: 'Appuyer sur O', a: 'O donne T, comme la dernière fois.' },
    s3: { t: 'Le tableau de connexions',
      p: "Sur la face avant, sous le clavier, 26 prises, une par lettre : le tableau de connexions. Un câble relie deux prises et échange leurs deux lettres. Avec un câble entre O et H, un O devient H avant d’entrer dans les rotors, et un H devient O. Une lettre sans câble reste elle-même. La feuille du jour en donne dix : BS CZ DN ER FI GU HO KW LM QY. Six lettres restent sans câble : A, J, P, T, V et X.",
      go: 'Brancher les dix câbles', a: 'Dix câbles : vingt lettres échangées deux à deux.' },
    s4: { t: 'Le câble, à l’aller',
      p: "Départ AAA. Alice appuie sur O, et le rotor de droite avance en AAB, comme avant. Mais le courant passe d’abord par la prise O, et le câble l’emmène à la prise H : c’est en H, et non plus en O, qu’il entre dans la plaque d’entrée. Les rotors ne voient plus un O mais un H : le rotor III l’envoie en Q, le II le laisse en Q, le I l’envoie en X.",
      go: 'Appuyer sur O', a: 'H, Q, Q, X : plus rien à voir avec D, K, N.' },
    s5: { t: 'Le câble, au retour',
      p: "Le réflecteur renvoie le courant de X à J. Il repasse les rotors, Z, S, puis I, et ressort de la plaque d’entrée à la lettre I. Mais avant la lampe, il repasse par le tableau : un câble relie I à F. C’est la lampe F qui s’allume. Le même O, au même départ, donnait T sans câble ; avec les câbles, il donne F. Le courant traverse le tableau deux fois, à l’aller et au retour.",
      go: 'Faire revenir le courant', a: 'Lampe F : le tableau a joué deux fois.' },
    s6: { t: 'Dans les deux sens',
      p: "Pour déchiffrer, Bob devra retrouver O en tapant F. Alice vérifie : elle remet AAA et tape F. Le câble F–I envoie le courant en I, et il suit exactement le chemin d’avant, à l’envers : S, Z, J, X, Q, Q, H. Le câble H–O le ramène en O : la lampe O s’allume. Un câble échange dans les deux sens, alors la machine déchiffre toujours ce qu’elle chiffre.",
      go: 'Remettre AAA et taper F', a: 'F redonne O : les câbles ne cassent rien.' },
    s7: { t: 'La bague',
      p: "Un rotor, ce sont deux pièces : l’anneau des lettres, qu’on lit dans la fenêtre, et le cœur, qui porte les 26 fils. Un point rouge marque le contact A du cœur ; jusqu’ici, il était sous la lettre A. Régler la bague, c’est choisir sous quelle lettre il se trouve. La feuille du jour dit : bague du rotor de droite sur B. Les deux autres restent sur A. Alice tourne le cœur du rotor de droite d’un cran dans l’anneau, et le point rouge passe sous la lettre B. Le fil en face du contact H part avec le cœur, sa trace pâle reste, et un autre fil, en bleu, prend sa place. La fenêtre montre toujours A.",
      go: 'Tourner la bague sur B', a: 'La fenêtre dit toujours A, mais les fils ont tourné.' },
    s8: { t: 'Même fenêtre, autre chemin',
      p: "Départ AAA, comme tout à l’heure, avec les mêmes câbles. Alice appuie sur O : le câble l’envoie en H, mais en face du H se trouve maintenant un autre fil du rotor de droite. Le courant suit P, C, M, le réflecteur, O, M, O, Z, et le câble Z–C allume la lampe C. Les lettres des fenêtres ne suffisent plus à dire le chemin : il faut aussi connaître les bagues.",
      go: 'Appuyer sur O', a: 'Même fenêtre AAA, et cette fois C au lieu de F.' },
    s9: { t: 'Départ ADU',
      p: "Il reste un point de la feuille : la position de départ, ADU. Alice tourne les rotors : A à gauche, D au milieu, U à droite. Regardez la dent verte sur le flanc gauche de chaque rotor : c’est son encoche, toujours à la même lettre ; V pour le rotor III. Alice tape le O de OUI. Le rotor de droite avance de U à V, et son encoche arrive en haut. Le câble O–H fait entrer le courant en H ; il ressort en B, et le câble B–S allume S.",
      go: 'Régler ADU et taper O', a: 'O devient S. Le rotor de droite montre V.' },
    s10: { t: 'L’encoche',
      p: "Quand la fenêtre de droite montre la lettre de son encoche, V, et qu’une touche est enfoncée, un cliquet tombe dans l’encoche et entraîne aussi le rotor du milieu. Alice tape U : le rotor de droite passe de V à W, et le rotor du milieu de D à E. La machine est en AEW. Le câble U–G fait entrer le courant en G ; il ressort en L, et le câble L–M allume M.",
      go: 'Taper U', a: 'Le rotor du milieu a bougé : AEW.' },
    s11: { t: 'Le double pas',
      p: "Le rotor du milieu montre E : c’est la lettre de l’encoche du rotor II. Alice tape I. Le rotor de droite avance, de W à X. Et le cliquet du rotor de gauche tombe dans l’encoche du rotor du milieu : il pousse le rotor de gauche, de A à B, et, en appuyant dans cette encoche, il pousse aussi le rotor du milieu, de E à F. Le rotor du milieu a avancé deux fois de suite : c’est le double pas. La machine est en BFX. Le câble I–F fait entrer le courant en F, il ressort en W, et le câble W–K allume K. OUI devient SMK.",
      go: 'Taper I', a: 'SMK. Et le rotor du milieu a fait deux pas de suite.' },
    s12: { t: 'Par radio',
      p: "Alice envoie SMK par radio, et Eve note les trois lettres au passage, comme toujours. Elle sait comment une Enigma est faite. Ce qu’elle ignore, c’est le réglage du jour : les rotors, les bagues, les câbles et le départ.",
      go: 'Revoir l’envoi', e: 'SMK… Et la feuille du jour est restée chez Alice et Bob.' },
    s13: { t: 'Bob déchiffre',
      p: "Bob a la même feuille : rotors I, II, III, bague du rotor de droite sur B, les dix mêmes câbles, départ ADU. Il tape S, M, K. Ses rotors font exactement les mêmes pas que ceux d’Alice, encoche et double pas compris, et chaque lettre suit le chemin d’Alice à l’envers : S allume O, M allume U, K allume I.",
      go: 'Taper SMK', b: 'O, U, I : OUI ! Même feuille, même chemin.' },
    s14: { t: 'Cinq rotors',
      p: "Combien de réglages possibles ? Comptons, une partie à la fois. La machine est livrée avec cinq rotors, de I à V, chacun avec ses propres fils et son encoche : Q, E, V, J et Z. On en place trois, dans un ordre. Pour la place de gauche, 5 choix ; il en reste 4 pour le milieu, puis 3 pour la droite : 5 × 4 × 3 = 60 ordres. Pour chacun, 26 × 26 × 26 = 17 576 positions de départ : 60 × 17 576 = 1 054 560.",
      go: 'Compter les ordres', a: '60 ordres et 17 576 départs : déjà plus d’un million.' },
    s15: { t: 'Les câbles',
      p: "Les câbles comptent bien plus. Le premier relie deux lettres parmi 26 : 26 × 25 / 2 = 325 choix (on divise par 2, car O–H et H–O, c’est le même câble). Le deuxième relie deux des 24 lettres restantes : 276 choix. Et ainsi de suite jusqu’au dixième, entre les 8 dernières. Mais l’ordre dans lequel on branche les câbles ne change pas le tableau : deux câbles se branchent dans 2 ordres, trois dans 2 × 3 = 6 ; alors au k-ième câble, on divise encore par k. Avec dix câbles : 150 738 274 937 250 tableaux possibles.",
      go: 'Compter câble par câble', e: 'Cent cinquante mille milliards de tableaux, pour les câbles seuls…' },
    s16: { t: 'Le total',
      p: "On multiplie : 60 ordres × 17 576 départs × 150 738 274 937 250 tableaux = 158 962 555 217 826 360 000 réglages, environ 1,59 × 10²⁰. Et les bagues ? Ce compte les laisse de côté. Tourner d’un même cran la bague et la position de départ d’un rotor laisse ses fils au même endroit : seul change le moment où il entraîne son voisin. Pour le rotor de gauche, qui n’entraîne personne, cela ne change rien du tout. Les bagues du milieu et de droite ajoutent donc au plus 26 × 26 = 676 variantes, que bien des messages courts ne distinguent même pas.",
      go: 'Faire le produit', e: 'À un million d’essais par seconde, il me faudrait cinq millions d’années.' },
    s17: { t: 'Un défaut est resté',
      p: "Toutes ces pièces n’ont pas effacé le défaut du réflecteur : il ne renvoie jamais le courant sur son propre contact. Les câbles échangent les lettres à l’entrée et à la sortie, de la même façon dans les deux sens : pour que la touche O allume la lampe O, le courant devrait ressortir des rotors sur le contact même où il y est entré. Alors, câbles ou pas, une lettre n’est jamais chiffrée en elle-même. Alan Turing et Bletchley Park s’en serviront, avec des mots devinés, pour casser Enigma : c’est l’épisode 5.3, « La casse ».",
      a: 'Avec tout ça, une lettre ne devient toujours jamais elle-même ?', e: 'Jamais. Et ça, je vais m’en servir.' },
    s18: { t: 'À vous',
      p: "Dans le bac à sable, choisissez trois rotors parmi cinq, réglez les bagues, branchez des câbles, choisissez le départ, puis tapez : chaque touche montre son chemin, câbles compris. Remettez le même départ et tapez le chiffré : le message revient. Ou testez-vous avec le quiz.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz' },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Réglez la machine comme une feuille du jour, puis tapez des lettres, ici ou sur votre clavier.',
    rotors: 'Rotors (gauche, milieu, droite)', rings: 'Bagues', start: 'Position de départ', cables: 'Câbles',
    cablesHint: 'paires de lettres, ex. BS CZ', cablesBad: 'Câbles refusés : chaque lettre une seule fois, des paires de deux lettres différentes.',
    twice: 'Un rotor ne peut servir qu’une fois.', day: 'Reprendre le réglage du jour', bare: 'Machine nue (sans câble)',
    keys: 'Clavier', slow: 'Au ralenti (tout le chemin)',
    reset: 'Remettre au départ', replay: 'Remettre au départ et taper le chiffré',
    typed: 'Tapé', lit: 'Allumé', pos: 'Position des rotors : {p}', ready: 'Prêt : tapez une lettre.',
    back: 'Même réglage, on a tapé le chiffré : le message revient.',
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
  tab: 'Enigma, the Real Setting — Crypto, Visualized',
  title: 'Enigma, the Real Setting',
  subtitle: 'Cables, rings, the notch and the double step, five rotors: the whole setting of the day, and how many there are.',
  loading: 'Plugging the cables…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve' },
  part: { entry: 'entry', ref: 'reflector B' },
  notchWord: 'notch', ringWord: 'ring',
  card: { title: 'The path of the current', key: 'key', from: 'start', ref: 'ref', whose: { a: 'Alice’s machine', b: 'Bob’s machine' },
    setup: 'rotors {r}', rings: 'rings {g}', pos: 'position {p}', start: 'from {p}', cables: 'cables:', noCable: 'none',
    blank: 'No key pressed yet.' },
  tally: { title: 'How many settings?', sub: { orders: 'the rotors and the start', cables: 'ten cables, one at a time', total: 'all multiplied' },
    orders: 'rotor orders', starts: 'starts', both: 'both', cable: 'cable', free: 'free letters', places: 'choices', ways: 'boards',
    cables10: 'boards with 10 cables', total: 'settings' },
  ch: ['The setting of the day', 'The cables', 'The ring', 'The notch', 'The message', 'How many keys?', 'What comes next'],
  steps: {
    s1: { t: 'The setting of the day',
      p: "Alice must again answer Bob « OUI » (French for yes), by radio, and Eve is still listening. So far their Enigma was a simplified one: no cable, the rings on A, and only the right rotor turned. The real machine is set in four parts, written down every day on a sheet: which rotors and in which order, the ring of each rotor, the cables of the plugboard, and the start position. Let us add them one at a time.",
      a: 'Today I set the machine the way real operators did.', b: 'I have the same sheet as Alice: the same setting.', e: 'More parts in the machine… more things I do not know.' },
    s2: { t: 'The bare machine',
      p: "First, the machine as we left it: rotors I, II and III, reflector B, start AAA, and nothing else. Alice presses O: the right rotor steps to AAB, the current follows D, K, N, the reflector, K, B, J, T, and lamp T lights up. Everything we add now will change this path.",
      go: 'Press O', a: 'O gives T, like last time.' },
    s3: { t: 'The plugboard',
      p: "On the front, below the keyboard, 26 sockets, one per letter: the plugboard. A cable joins two sockets and swaps their two letters. With a cable between O and H, an O becomes H before it enters the rotors, and an H becomes O. A letter with no cable stays itself. The sheet of the day gives ten: BS CZ DN ER FI GU HO KW LM QY. Six letters stay without a cable: A, J, P, T, V and X.",
      go: 'Plug the ten cables', a: 'Ten cables: twenty letters swapped in pairs.' },
    s4: { t: 'The cable, going in',
      p: "Start AAA. Alice presses O, and the right rotor steps to AAB, as before. But the current first goes through socket O, and the cable takes it to socket H: it enters the entry plate at H, no longer at O. The rotors no longer see an O but an H: rotor III sends it to Q, II leaves it at Q, I sends it to X.",
      go: 'Press O', a: 'H, Q, Q, X: nothing like D, K, N any more.' },
    s5: { t: 'The cable, coming back',
      p: "The reflector sends the current back from X to J. It crosses the rotors again, Z, S, then I, and comes out of the entry plate at letter I. But before the lamp it goes through the plugboard again: a cable joins I to F. Lamp F lights up. The same O, from the same start, gave T without cables; with the cables it gives F. The current crosses the plugboard twice, going in and coming back.",
      go: 'Bring the current back', a: 'Lamp F: the plugboard played twice.' },
    s6: { t: 'Both ways',
      p: "To decrypt, Bob will have to get O back by typing F. Alice checks: she sets AAA again and types F. The F–I cable sends the current to I, and it follows exactly the path from before, backwards: S, Z, J, X, Q, Q, H. The H–O cable brings it to O: lamp O lights up. A cable swaps both ways, so the machine still decrypts what it encrypts.",
      go: 'Set AAA again and type F', a: 'F gives O back: the cables break nothing.' },
    s7: { t: 'The ring',
      p: "A rotor is two parts: the ring of letters, read through the window, and the core, which carries the 26 wires. A red dot marks the core's contact A; so far it sat under letter A. Setting the ring means choosing which letter it sits under. The sheet of the day says: right rotor's ring on B. The other two stay on A. Alice turns the right rotor's core one notch inside its ring, and the red dot moves under letter B. The wire facing contact H leaves with the core, its faint trace stays, and another wire, in blue, takes its place. The window still shows A.",
      go: 'Turn the ring to B', a: 'The window still says A, but the wires have turned.' },
    s8: { t: 'Same window, another path',
      p: "Start AAA, as before, with the same cables. Alice presses O: the cable sends it to H, but facing H there is now another wire of the right rotor. The current follows P, C, M, the reflector, O, M, O, Z, and the Z–C cable lights lamp C. The letters in the windows no longer tell the path: you also need the rings.",
      go: 'Press O', a: 'Same window AAA, and this time C instead of F.' },
    s9: { t: 'Start ADU',
      p: "One point of the sheet is left: the start position, ADU. Alice turns the rotors: A on the left, D in the middle, U on the right. Look at the green tooth on the left side of each rotor: it is its notch, always at the same letter; V for rotor III. Alice types the O of OUI. The right rotor steps from U to V, and its notch comes to the top. The O–H cable brings the current in at H; it comes out at B, and the B–S cable lights S.",
      go: 'Set ADU and type O', a: 'O becomes S. The right rotor shows V.' },
    s10: { t: 'The notch',
      p: "When the right window shows its notch letter, V, and a key goes down, a pawl drops into the notch and carries the middle rotor along too. Alice types U: the right rotor goes from V to W, and the middle rotor from D to E. The machine is at AEW. The U–G cable brings the current in at G; it comes out at L, and the L–M cable lights M.",
      go: 'Type U', a: 'The middle rotor moved: AEW.' },
    s11: { t: 'The double step',
      p: "The middle rotor shows E: that is the notch letter of rotor II. Alice types I. The right rotor steps, from W to X. And the left rotor's pawl drops into the middle rotor's notch: it pushes the left rotor, from A to B, and, pressing in that notch, it pushes the middle rotor too, from E to F. The middle rotor has stepped twice in a row: that is the double step. The machine is at BFX. The I–F cable brings the current in at F, it comes out at W, and the W–K cable lights K. OUI becomes SMK.",
      go: 'Type I', a: 'SMK. And the middle rotor took two steps in a row.' },
    s12: { t: 'By radio',
      p: "Alice sends SMK by radio, and Eve writes down the three letters as they pass, as always. She knows how an Enigma is built. What she does not know is the setting of the day: the rotors, the rings, the cables and the start.",
      go: 'Replay the sending', e: 'SMK… And the sheet of the day stayed with Alice and Bob.' },
    s13: { t: 'Bob decrypts',
      p: "Bob has the same sheet: rotors I, II, III, right rotor's ring on B, the same ten cables, start ADU. He types S, M, K. His rotors take exactly the same steps as Alice's, notch and double step included, and each letter follows Alice's path backwards: S lights O, M lights U, K lights I.",
      go: 'Type SMK', b: 'O, U, I: OUI! Same sheet, same path.' },
    s14: { t: 'Five rotors',
      p: "How many settings are there? Let us count, one part at a time. The machine comes with five rotors, I to V, each with its own wires and its notch: Q, E, V, J and Z. Three go in, in an order. For the left place, 5 choices; 4 are left for the middle, then 3 for the right: 5 × 4 × 3 = 60 orders. For each, 26 × 26 × 26 = 17,576 start positions: 60 × 17,576 = 1,054,560.",
      go: 'Count the orders', a: '60 orders and 17,576 starts: over a million already.' },
    s15: { t: 'The cables',
      p: "The cables count for much more. The first one joins two letters out of 26: 26 × 25 / 2 = 325 choices (divided by 2, since O–H and H–O are the same cable). The second joins two of the 24 letters left: 276 choices. And so on up to the tenth, among the last 8. But the order in which the cables are plugged does not change the board: two cables can be plugged in 2 orders, three in 2 × 3 = 6; so at the k-th cable we divide again by k. With ten cables: 150,738,274,937,250 possible boards.",
      go: 'Count cable by cable', e: 'A hundred and fifty trillion boards, for the cables alone…' },
    s16: { t: 'The total',
      p: "Multiply: 60 orders × 17,576 starts × 150,738,274,937,250 boards = 158,962,555,217,826,360,000 settings, about 1.59 × 10²⁰. And the rings? This count leaves them out. Turning a rotor's ring and its start position by the same notch leaves its wires in the same place: only the moment it carries its neighbour changes. For the left rotor, which carries nobody, it changes nothing at all. So the middle and right rings add at most 26 × 26 = 676 variants, which many short messages cannot even tell apart.",
      go: 'Multiply it out', e: 'At a million tries a second, it would take me five million years.' },
    s17: { t: 'A flaw remained',
      p: "All these parts did not remove the reflector's flaw: it never sends the current back on its own contact. The cables swap letters going in and coming out, the same way both ways: for key O to light lamp O, the current would have to come out of the rotors on the very contact it went in by. So, cables or not, a letter is never encrypted as itself. Alan Turing and Bletchley Park would use it, with guessed words, to break Enigma: that is episode 5.3, « La casse » (the break).",
      a: 'With all that, a letter still never becomes itself?', e: 'Never. And that, I will use.' },
    s18: { t: 'Your turn',
      p: "In the sandbox, pick three rotors out of five, set the rings, plug cables, choose the start, then type: every key shows its path, cables included. Set the same start again and type the cipher: the message comes back. Or test yourself with the quiz.",
      go: 'Try the sandbox', go2: 'Take the quiz' },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Set the machine like a sheet of the day, then type letters, here or on your own keyboard.',
    rotors: 'Rotors (left, middle, right)', rings: 'Rings', start: 'Start position', cables: 'Cables',
    cablesHint: 'pairs of letters, e.g. BS CZ', cablesBad: 'Cables refused: each letter once only, pairs of two different letters.',
    twice: 'A rotor can only be used once.', day: 'Back to the setting of the day', bare: 'Bare machine (no cable)',
    keys: 'Keyboard', slow: 'Slow motion (the whole path)',
    reset: 'Back to the start', replay: 'Back to the start and type the cipher',
    typed: 'Typed', lit: 'Lit', pos: 'Rotor position: {p}', ready: 'Ready: type a letter.',
    back: 'Same setting, the cipher typed: the message comes back.',
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
