// Every visible word, in French (the course language) and English.
// t('key', {vars}) reads the current language; setLang() re-renders [data-i18n].
// Le tunnel (r197): what each box on the way reads off a packet, with and without HTTPS, then with a
// WireGuard tunnel (one X25519 exchange, ChaCha20-Poly1305), and who sees what once it is up. Every
// address, byte and count written here is checked against js/net.js by tests/vpn_values.mjs.

const fr = {
  series: 'Crypto en visuel',
  tab: 'Le tunnel — Crypto en visuel',
  title: 'Le tunnel',
  subtitle: 'Un VPN scelle chaque paquet jusqu’à un autre serveur : qui voit encore quoi ?',
  loading: 'On tire les câbles…',
  'mode.story': 'Histoire', 'mode.sandbox': 'Bac à sable', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Précédent', 'nav.next': 'Suivant ▶', 'nav.count': 'Étape {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', v: 'Victor', n: 'Le chroniqueur' },
  ch: ['Le chemin', 'Sans tunnel', 'Le tunnel', 'Qui voit quoi', 'Pourquoi, et jusqu’où'],
  place: { cafe: 'Le café', isp: 'Le fournisseur d’accès', vpn: 'Serveur VPN · autre ville', bob: 'Le site de Bob' },
  tag: {
    place: { cafe: 'le café', bob: 'Bob', vpn: 'le VPN' },
    head: { e: 'Eve, {at}', i: 'Le fournisseur d’accès', v: 'Victor, au VPN', b: 'Bob, sur son site' },   // a phone's first line: whose tag (r344)
    from: 'de {addr} ({who})', to: 'vers {addr} ({who})',
    clear: 'lit : {c}', pw: 'user=alice&pass=soleil42', reads: 'lit la demande',
    locked: 'contenu : fermé (HTTPS)', sealed: 'scellé : {n} octets illisibles', when: 'l’heure, la taille',
    nothing: 'ne voit rien passer', asks: 'où est {name} ?', answer: '→ {addr}',
    gotPub: 'la clé publique d’Alice', twoPubs: 'deux clés publiques', noSecret: 'aucun secret',
    badTag: 'sceau faux', thrown: 'paquet jeté',
    secret: 'secret', public: 'publique', shared: 'clé commune',
  },
  card: {
    map: 'Les adresses', cafe: 'le café (sa box Wi-Fi)', bob: 'le site de Bob', vpn: 'le serveur VPN de Victor',
    docs: 'Des adresses réservées aux exemples : aucune vraie machine n’y répond.',
    env: 'L’enveloppe', outside: 'dehors', inside: 'dedans', from: 'de', to: 'vers', request: 'la demande pour le site',
    sees: 'Qui voit quoi', noTunnel: 'sans tunnel', withTunnel: 'avec le tunnel', https: 'HTTPS', http: 'HTTP simple',
    cols: ['', 'd’où', 'vers où', 'le nom', 'le contenu', 'heure, taille'],
    rows: { e: 'Eve, au café', i: 'le fournisseur', v: 'Victor (VPN)', b: 'Bob' },
    read: 'lu', locked: 'fermé', sealed: 'scellé', yes: 'oui', none: '—',
    keys: 'Deux paires de clés', secretRow: 'secret', publicRow: 'publique', kept: '32 octets, gardés chez soi',
    keysLegend: 'publique = secret × le point 9 de la courbe X25519',
    shared: 'Le même secret', aCalc: 'Alice : son secret × la publique de Victor', vCalc: 'Victor : son secret × la publique d’Alice',
    eCalc: 'Eve : publique × publique ne donne rien.',
    seal: 'Le paquet scellé', plain: 'dedans', keyRow: 'clé commune', nonce: 'numéro du paquet', ct: 'chiffré (ChaCha20)', tagRow: 'sceau (Poly1305)',
    newEnv: 'nouvelle enveloppe', octets: '{n} octets',
    flip: 'Un bit de changé', got: 'reçu', sent: 'sceau envoyé', recomputed: 'sceau recalculé', reject: 'Les deux sceaux diffèrent : le paquet est jeté sans être ouvert.',
    trust: 'La confiance se déplace', ispBefore: 'le fournisseur, sans tunnel', victorAfter: 'Victor, avec le tunnel',
  },
  steps: {
    s1: { t: 'Un café, un site, des câbles',
      p: "Alice est au café, sur son ordinateur portable. Elle veut ouvrir le site de Bob, qui tourne sur un serveur à l’autre bout de la ville. Entre les deux : la box Wi-Fi du café, puis les câbles et les machines de son fournisseur d’accès à Internet. À la table voisine, Eve est connectée au même Wi-Fi. Plus haut dans la vallée, dans une autre ville, Victor fait tourner un serveur VPN : on y viendra.",
      a: 'Je vais juste regarder mon compte sur le site de Bob.', e: 'Le Wi-Fi du café est ouvert. Tout ce qui y passe, je le capte.' },
    s2: { t: 'Une enveloppe, une adresse',
      p: "Sur Internet, tout voyage en paquets. Un paquet, c’est une enveloppe : dedans, le message ; dehors, deux adresses. Celle du site de Bob, {g|198.51.100.20}, et celle d’où vient l’enveloppe, {b|203.0.113.7}. Ce n’est pas l’adresse de l’ordinateur d’Alice : la box du café écrit la sienne sur les enveloppes de tous ses clients, et c’est elle que le reste d’Internet voit. Sans l’adresse dehors, personne ne saurait où porter l’enveloppe.",
      go: 'Envoyer l’enveloppe', b: 'Une demande pour mon site, de 203.0.113.7.' },
    s3: { t: 'Chaque boîte lit l’adresse',
      p: "En chemin, l’enveloppe passe de boîte en boîte : la box du café, puis les machines du fournisseur, qu’on appelle des routeurs. Aucune ne connaît tout le chemin : chacune lit l’adresse sur l’enveloppe et la passe au câble qui va dans la bonne direction. C’est comme ça qu’Internet marche, ce n’est pas un défaut. Mais toutes ces boîtes voient l’adresse, et elles peuvent voir plus.",
      go: 'Revoir le trajet' },
    s4: { t: 'Sans HTTPS, tout se lit',
      p: "Si le site de Bob est en HTTP simple, le message lui-même n’est pas chiffré. Le Wi-Fi du café est ouvert : sans mot de passe, ses ondes ne sont pas chiffrées non plus. Eve, à la table voisine, capte chaque enveloppe qui passe dans l’air et lit tout : l’adresse, et dedans, le nom d’utilisateur et le mot de passe d’Alice.",
      go: 'Se connecter au site', e: 'alice, soleil42. Merci.' },
    s5: { t: 'Avec HTTPS, le contenu est fermé',
      p: "Le site de Bob passe en HTTPS : l’ordinateur d’Alice et le serveur de Bob chiffrent le contenu de bout en bout. Eve ne lit plus le mot de passe. Mais l’enveloppe garde son adresse dehors, et d’autres choses fuient :\n- avant d’envoyer, l’ordinateur demande où se trouve {r|bob.example}, et cette question part souvent en clair ;\n- le premier message du HTTPS annonce souvent le nom du site, en clair lui aussi ;\n- l’heure et la taille de chaque enveloppe se voient toujours.\n\nEve ne sait pas ce qu’Alice fait sur le site. Elle sait qu’elle y est, quand, et combien.",
      go: 'Demander le site, puis se connecter', e: 'Le mot de passe, non. Mais elle est sur bob.example.' },
    s6: { t: 'Le fournisseur voit la même chose',
      p: "Eve n’est qu’une cliente du café. Le fournisseur d’accès, lui, voit passer toutes les enveloppes de la box du café, et celles de milliers d’autres clients : les mêmes adresses, les mêmes noms, les mêmes heures. Il peut les garder dans un journal, et il peut aussi bloquer un site, en refusant les enveloppes qui portent son adresse.",
      go: 'Envoyer encore', e: 'Moi, je ne vois que le café. Lui voit tout le quartier.' },
    s7: { t: 'Deux paires de clés',
      p: "Alice allume un VPN. Victor fait tourner le serveur VPN, dans une autre ville, et le VPN d’Alice utilise WireGuard. Tout commence par une paire de clés de chaque côté : un secret de 32 octets, gardé chez soi ({r|en rouge}), et une clé publique ({b|en bleu}), calculée à partir du secret sur la courbe X25519. Retrouver le secret à partir de la clé publique, personne ne sait le faire. Alice et Victor s’envoient leurs clés publiques, en clair : Eve les voit passer.",
      go: 'Échanger les clés publiques', v: 'Ma clé publique part. Mon secret reste ici.' },
    s8: { t: 'Le même secret des deux côtés',
      p: "Chacun multiplie la clé publique de l’autre par son propre secret, sur la courbe. Alice et Victor tombent sur les mêmes 32 octets : {g|c9 f8 19 a0…}. C’est l’idée des pots de peinture de l’épisode 3, faite sur une courbe. Eve a vu passer les deux clés publiques, mais sans l’un des deux secrets, elle ne peut pas refaire le calcul. Le vrai WireGuard fait plusieurs échanges comme celui-ci et mélange leurs résultats dans un hachage ; ici, on garde le secret tel quel comme clé.",
      go: 'Calculer le secret', e: 'J’ai les deux clés publiques. Elles ne me servent à rien.' },
    s9: { t: 'Sceller l’enveloppe, adresse comprise',
      p: "L’ordinateur d’Alice prend maintenant toute l’enveloppe pour Bob, adresse comprise, et la scelle avec ChaCha20-Poly1305 et la clé commune. ChaCha20 brouille les octets ; Poly1305 y ajoute un sceau de 16 octets, calculé sur le tout. Le paquet scellé part dans une nouvelle enveloppe, adressée au serveur VPN : {g|192.0.2.44}. Chez Victor, le sceau est vérifié, l’enveloppe ressort intacte et repart vers Bob. Sur la carte, la ligne dorée montre le chemin scellé, le tunnel.",
      go: 'Envoyer par le tunnel', e: 'Vers 192.0.2.44, et c’est tout ce que je lis.' },
    s10: { t: 'Un bit de travers',
      p: "Supposons qu’Eve puisse aussi modifier ce qui passe : sur un Wi-Fi ouvert, il lui suffit de se faire passer pour la box du café. Elle change un seul bit d’un octet du paquet scellé : {r|3a} devient {r|3b}. Chez Victor, le sceau recalculé sur ce qui est arrivé ne correspond plus à celui qu’Alice a envoyé, comme dans l’épisode 1.3. Le paquet est jeté sans être ouvert : Eve peut empêcher un paquet d’arriver, mais pas en faire passer un faux.",
      go: 'Changer un bit', v: 'Le sceau ne correspond pas. Je jette.' },
    s11: { t: 'Qui voit quoi, avec le tunnel',
      p: "Avec le tunnel, reprenons chaque place :\n- Eve et le fournisseur voient des enveloppes du café vers {g|192.0.2.44}, leur heure et leur taille. Ni le site, ni son nom, ni le contenu ;\n- Bob voit arriver les demandes de {b|192.0.2.44}, plus de 203.0.113.7 : pour lui, Alice est dans l’autre ville.\n\nLe tableau compare avec ce qu’ils voyaient sans le tunnel.",
      go: 'Envoyer et regarder', b: 'Une demande de 192.0.2.44, l’autre ville.' },
    s12: { t: 'La confiance se déplace',
      p: "Il reste Victor. Son serveur ouvre le tunnel : il voit d’où vient Alice, où elle va, le nom du site, l’heure, la taille. Exactement ce que le fournisseur voyait avant. Le contenu, lui, reste fermé par le HTTPS de Bob. Un VPN ne fait pas disparaître celui qui regarde : il le remplace. Choisir un VPN, c’est choisir de faire confiance à Victor plutôt qu’au fournisseur et au Wi-Fi du café.",
      go: 'Envoyer', v: 'Le café, bob.example… je vois ce que le fournisseur voyait.' },
    s13: { t: 'À quoi ça sert',
      p: "Un VPN a de vraies raisons d’être :\n- sur un Wi-Fi public ouvert, comme celui du café, personne autour ne lit plus où l’on va, ni ne modifie rien sans se faire repérer ;\n- un fournisseur qui garde un journal des sites, ou qui en bloque, ne voit plus que l’adresse du VPN ;\n- le site voit l’adresse du VPN : on semble venir de l’autre ville, ou d’un autre pays.\n\nC’est aussi ce qu’une entreprise donne à ses employés pour entrer dans son réseau depuis chez eux.",
      go: 'Envoyer par le tunnel', a: 'Plus personne au café ne lit où je vais.' },
    s14: { t: 'Et ce qu’il ne fait pas',
      p: "Un VPN n’est pas une cape d’invisibilité :\n- ce n’est pas l’anonymat : si Alice se connecte à son compte, ou si le site la reconnaît par un cookie, Bob sait que c’est elle, VPN ou pas ;\n- il ne protège ni d’un virus, ni d’un faux site où l’on tape son mot de passe ;\n- le contenu, le HTTPS le protégeait déjà ; le VPN cache surtout **où** l’on va, à ceux qui sont près de nous.\n\nDans le bac à sable, allumez ou éteignez le VPN et le HTTPS, placez Eve où vous voulez, et lisez ce qu’elle voit. Ou testez-vous avec le quiz.",
      go: 'Essayer dans le bac à sable', go2: 'Faire le quiz' },
  },
  sb: {
    title: 'Bac à sable',
    hint: 'Choisissez, placez Eve, puis envoyez une demande au site de Bob.',
    path: 'Le chemin', vpn: 'VPN', https: 'HTTPS', on: 'allumé', off: 'éteint',
    eve: 'Eve écoute…', at: { cafe: 'au café', isp: 'chez le fournisseur', vpn: 'au VPN', bob: 'chez Bob' },
    flip: 'Eve change un bit en chemin', send: 'Envoyer ▶', reset: 'Recommencer',
    ready: 'Prêt : choisissez, puis envoyez.', flipNo: 'Un bit changé ne se voit que dans le tunnel, et avant le VPN.',
    seen: 'Ce qu’Eve lit à cette place :', arrived: 'La demande est arrivée chez Bob.', dropped: 'Le serveur VPN a jeté le paquet : son sceau était faux.',
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
  tab: 'The Tunnel — Crypto, Visualized',
  title: 'The Tunnel',
  subtitle: 'A VPN seals every packet up to another server: who still sees what?',
  loading: 'Pulling the cables…',
  'mode.story': 'Story', 'mode.sandbox': 'Sandbox', 'mode.quiz': 'Quiz',
  'nav.prev': '◀ Back', 'nav.next': 'Next ▶', 'nav.count': 'Step {i} / {n}',
  who: { a: 'Alice', b: 'Bob', e: 'Eve', v: 'Victor', n: 'The chronicler' },
  ch: ['The way', 'No tunnel', 'The tunnel', 'Who sees what', 'Why, and how far'],
  place: { cafe: 'The café', isp: 'The internet provider', vpn: 'VPN server · another town', bob: 'Bob’s site' },
  tag: {
    place: { cafe: 'the café', bob: 'Bob', vpn: 'the VPN' },
    head: { e: 'Eve, {at}', i: 'The internet provider', v: 'Victor, at the VPN', b: 'Bob, at his site' },
    from: 'from {addr} ({who})', to: 'to {addr} ({who})',
    clear: 'reads: {c}', pw: 'user=alice&pass=soleil42', reads: 'reads the request',
    locked: 'content: closed (HTTPS)', sealed: 'sealed: {n} unreadable bytes', when: 'the time, the size',
    nothing: 'sees nothing go by', asks: 'where is {name}?', answer: '→ {addr}',
    gotPub: 'Alice’s public key', twoPubs: 'two public keys', noSecret: 'no secret',
    badTag: 'wrong seal', thrown: 'packet thrown away',
    secret: 'secret', public: 'public', shared: 'shared key',
  },
  card: {
    map: 'The addresses', cafe: 'the café (its Wi-Fi box)', bob: 'Bob’s site', vpn: 'Victor’s VPN server',
    docs: 'Addresses set aside for examples: no real machine answers them.',
    env: 'The envelope', outside: 'outside', inside: 'inside', from: 'from', to: 'to', request: 'the request for the site',
    sees: 'Who sees what', noTunnel: 'no tunnel', withTunnel: 'with the tunnel', https: 'HTTPS', http: 'plain HTTP',
    cols: ['', 'from where', 'to where', 'the name', 'the content', 'time, size'],
    rows: { e: 'Eve, at the café', i: 'the provider', v: 'Victor (VPN)', b: 'Bob' },
    read: 'read', locked: 'closed', sealed: 'sealed', yes: 'yes', none: '—',
    keys: 'Two key pairs', secretRow: 'secret', publicRow: 'public', kept: '32 bytes, kept at home',
    keysLegend: 'public = secret × the point 9 of the X25519 curve',
    shared: 'The same secret', aCalc: 'Alice: her secret × Victor’s public key', vCalc: 'Victor: his secret × Alice’s public key',
    eCalc: 'Eve: public × public gives nothing.',
    seal: 'The sealed packet', plain: 'inside', keyRow: 'shared key', nonce: 'packet number', ct: 'encrypted (ChaCha20)', tagRow: 'seal (Poly1305)',
    newEnv: 'new envelope', octets: '{n} bytes',
    flip: 'One bit changed', got: 'received', sent: 'seal sent', recomputed: 'seal recomputed', reject: 'The two seals differ: the packet is thrown away unopened.',
    trust: 'The trust moves', ispBefore: 'the provider, no tunnel', victorAfter: 'Victor, with the tunnel',
  },
  steps: {
    s1: { t: 'A café, a site, some cables',
      p: "Alice is at the café, on her laptop. She wants to open Bob’s site, which runs on a server at the other end of town. In between: the café’s Wi-Fi box, then the cables and machines of her internet provider. At the next table, Eve is on the same Wi-Fi. Up the valley, in another town, Victor runs a VPN server: we will get there.",
      a: 'I just want to check my account on Bob’s site.', e: 'The café’s Wi-Fi is open. Whatever goes through it, I pick up.' },
    s2: { t: 'An envelope, an address',
      p: "On the internet, everything travels in packets. A packet is an envelope: inside, the message; outside, two addresses. The address of Bob’s site, {g|198.51.100.20}, and the one the envelope comes from, {b|203.0.113.7}. That is not the address of Alice’s laptop: the café’s box writes its own on the envelopes of all its customers, and that is the one the rest of the internet sees. Without the address outside, nobody would know where to take the envelope.",
      go: 'Send the envelope', b: 'A request for my site, from 203.0.113.7.' },
    s3: { t: 'Every box reads the address',
      p: "On the way, the envelope goes from box to box: the café’s box, then the provider’s machines, called routers. None of them knows the whole way: each reads the address on the envelope and hands it to the cable that goes in the right direction. That is how the internet works, not a flaw. But every one of these boxes sees the address, and they can see more.",
      go: 'Watch the trip again' },
    s4: { t: 'Without HTTPS, everything can be read',
      p: "If Bob’s site uses plain HTTP, the message itself is not encrypted. The café’s Wi-Fi is open: with no password, its radio waves are not encrypted either. Eve, at the next table, picks up every envelope that goes through the air and reads it all: the address, and inside, Alice’s user name and password.",
      go: 'Log in to the site', e: 'alice, soleil42. Thanks.' },
    s5: { t: 'With HTTPS, the content is closed',
      p: "Bob’s site switches to HTTPS: Alice’s laptop and Bob’s server encrypt the content end to end. Eve no longer reads the password. But the envelope keeps its address outside, and other things leak:\n- before sending, the laptop asks where {r|bob.example} is, and that question often goes out in clear;\n- the first HTTPS message often announces the site’s name, in clear too;\n- the time and size of every envelope always show.\n\nEve does not know what Alice does on the site. She knows she is there, when, and how much.",
      go: 'Look up the site, then log in', e: 'The password, no. But she is on bob.example.' },
    s6: { t: 'The provider sees the same',
      p: "Eve is only a customer of the café. The internet provider sees every envelope of the café’s box go by, and those of thousands of other customers: the same addresses, the same names, the same times. It can keep them in a log, and it can also block a site, by refusing the envelopes that carry its address.",
      go: 'Send again', e: 'I only see the café. It sees the whole neighbourhood.' },
    s7: { t: 'Two key pairs',
      p: "Alice turns on a VPN. Victor runs the VPN server, in another town, and Alice’s VPN uses WireGuard. It all starts with a key pair on each side: a 32-byte secret, kept at home ({r|in red}), and a public key ({b|in blue}), computed from the secret on the X25519 curve. Nobody knows how to get the secret back from the public key. Alice and Victor send each other their public keys, in clear: Eve sees them go by.",
      go: 'Swap the public keys', v: 'My public key goes out. My secret stays here.' },
    s8: { t: 'The same secret on both sides',
      p: "Each one multiplies the other’s public key by their own secret, on the curve. Alice and Victor land on the same 32 bytes: {g|c9 f8 19 a0…}. It is the idea of the paint pots of episode 3, done on a curve. Eve saw both public keys go by, but without one of the two secrets she cannot redo the computation. The real WireGuard makes several exchanges like this one and mixes their results through a hash; here we keep the secret as it is, as the key.",
      go: 'Compute the secret', e: 'I have both public keys. They are no use to me.' },
    s9: { t: 'Seal the envelope, address and all',
      p: "Alice’s laptop now takes the whole envelope for Bob, address and all, and seals it with ChaCha20-Poly1305 and the shared key. ChaCha20 scrambles the bytes; Poly1305 adds a 16-byte seal, computed over all of it. The sealed packet goes out in a new envelope, addressed to the VPN server: {g|192.0.2.44}. At Victor’s, the seal is checked, the envelope comes out intact and goes on to Bob. On the map, the gold line shows the sealed way, the tunnel.",
      go: 'Send through the tunnel', e: 'To 192.0.2.44, and that is all I can read.' },
    s10: { t: 'One bit out of place',
      p: "Suppose Eve can also change what goes by: on an open Wi-Fi, she only has to pass herself off as the café’s box. She changes a single bit of one byte of the sealed packet: {r|3a} becomes {r|3b}. At Victor’s, the seal recomputed over what arrived no longer matches the one Alice sent, as in episode 1.3. The packet is thrown away unopened: Eve can stop a packet from arriving, but she cannot slip a fake one through.",
      go: 'Change a bit', v: 'The seal does not match. Thrown away.' },
    s11: { t: 'Who sees what, with the tunnel',
      p: "With the tunnel, let us go over each place again:\n- Eve and the provider see envelopes from the café to {g|192.0.2.44}, their time and size. Not the site, not its name, not the content;\n- Bob sees requests arrive from {b|192.0.2.44}, no longer from 203.0.113.7: for him, Alice is in the other town.\n\nThe table compares with what they saw without the tunnel.",
      go: 'Send and look', b: 'A request from 192.0.2.44, the other town.' },
    s12: { t: 'The trust moves',
      p: "That leaves Victor. His server opens the tunnel: he sees where Alice comes from, where she goes, the site’s name, the time, the size. Exactly what the provider saw before. The content stays closed by Bob’s HTTPS. A VPN does not make the watcher vanish: it replaces them. Choosing a VPN is choosing to trust Victor rather than the provider and the café’s Wi-Fi.",
      go: 'Send', v: 'The café, bob.example… I see what the provider used to see.' },
    s13: { t: 'What it is for',
      p: "A VPN has real reasons to exist:\n- on an open public Wi-Fi, like the café’s, nobody around can read where you go any more, nor change anything without being caught;\n- a provider that logs the sites, or blocks some, only sees the VPN’s address;\n- the site sees the VPN’s address: you seem to come from the other town, or from another country.\n\nIt is also what a company gives its employees to get into its network from home.",
      go: 'Send through the tunnel', a: 'Nobody at the café can read where I go any more.' },
    s14: { t: 'And what it does not do',
      p: "A VPN is not an invisibility cloak:\n- it is not anonymity: if Alice logs in to her account, or if the site knows her by a cookie, Bob knows it is her, VPN or not;\n- it protects neither from a virus nor from a fake site where you type your password;\n- the content was already protected by HTTPS; the VPN mostly hides **where** you go, from those near you.\n\nIn the sandbox, turn the VPN and HTTPS on or off, put Eve wherever you like, and read what she sees. Or test yourself with the quiz.",
      go: 'Try it in the sandbox', go2: 'Take the quiz' },
  },
  sb: {
    title: 'Sandbox',
    hint: 'Choose, place Eve, then send a request to Bob’s site.',
    path: 'The way', vpn: 'VPN', https: 'HTTPS', on: 'on', off: 'off',
    eve: 'Eve listens…', at: { cafe: 'at the café', isp: 'at the provider', vpn: 'at the VPN', bob: 'at Bob’s' },
    flip: 'Eve changes a bit on the way', send: 'Send ▶', reset: 'Start over',
    ready: 'Ready: choose, then send.', flipNo: 'A changed bit only shows inside the tunnel, before the VPN.',
    seen: 'What Eve reads in this place:', arrived: 'The request reached Bob.', dropped: 'The VPN server threw the packet away: its seal was wrong.',
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
// for tests/vpn_values.mjs, which reads the words without a browser
export const DICTS = dicts;
