// The series home page: one card per episode, published ones linked, the others « bientôt ».
// An episode's address is its folder, /<slug>/, and never moves: slide cards point to it.
// Inside an episode, #story=N is a STEP of that episode's story, not an episode number.

// Old links went to the root with Two Generals' hash (#story=5, #sandbox, #quiz, #shot=...):
// they now live in /deux-generaux/, so forward them there, query and hash intact.
function forwardOldLink() {
  if (/^#(story(=|$)|sandbox$|quiz$|shot=)/.test(location.hash))
    location.replace('deux-generaux/' + location.search + location.hash);
}
forwardOldLink();
addEventListener('hashchange', forwardOldLink);

// n = episode number, fixed for good; live = published. Order and picks: cryptographie r66.
// saga: 1 = the Two Generals saga (r89, Simon's layout A): numbered 1.1 to 1.6, shown as one group.
// saga: 5 = Enigma (r117, r118): 5.1 one key press, 5.2 the real setting, 5.3 the break. A saga's title is sagas[n] below.
const EPISODES = [
  { n: '1.1', slug: 'deux-generaux', icon: '🏰', live: true, saga: 1 },
  { n: '1.2', slug: 'eve-lit-tout', icon: '👁️', live: true, saga: 1 },
  { n: '1.3', slug: 'octet-change', icon: '✏️', live: true, saga: 1 },
  { n: '1.4', slug: 'cle-vallee', icon: '🔑', live: true, saga: 1 },
  { n: '1.5', slug: 'paquet-complet', icon: '📦', live: true, saga: 1 },
  { n: '1.6', slug: 'encore-des-tours', icon: '🎭', live: true, saga: 1 },
  { n: 2, slug: 'cadenas', icon: '🔒', live: true },
  { n: 3, slug: 'diffie-hellman', icon: '🎨', live: true },
  { n: 4, slug: 'scytale', icon: '📜', live: true },
  { n: '5.1', slug: 'enigma', icon: '⚙️', live: true, saga: 5 },
  { n: '5.2', slug: 'enigma-reglage', icon: '🔌', live: true, saga: 5 },
  { n: '5.3', slug: 'enigma-casse', icon: '🐝', live: true, saga: 5 },
  { n: 6, slug: 'pingouin', icon: '🐧', live: true },
  { n: 7, slug: 'sel', icon: '🧂', live: true },
  { n: 8, slug: 'garde', icon: '⏱️', live: true },
  { n: 9, slug: 'kasiski', icon: '🛞', live: true },
];

// The concepts each episode shows (r191), so a student finds one fast: a tag bar above the cards filters
// them (?tag=hmac links straight to a filter), and each card lists its own. Labels are tags in fr/en below.
// vpn is here ahead of its card (r221): an episode with no EPISODES entry is simply not drawn.
const TAGS = {
  'deux-generaux': ['canal', 'consensus'],
  'eve-lit-tout': ['sym', 'aes', 'iv'],
  'octet-change': ['integ', 'hmac'],
  'cle-vallee': ['pubkey', 'rsa', 'kex'],
  'paquet-complet': ['sym', 'aes', 'hmac', 'rsa'],
  'encore-des-tours': ['sig', 'gcm', 'replay', 'integ'],
  cadenas: ['pubkey'],
  'diffie-hellman': ['kex', 'dh', 'mitm'],
  scytale: ['hist', 'transpo'],
  enigma: ['hist', 'enigma', 'subst'],
  'enigma-reglage': ['hist', 'enigma'],
  'enigma-casse': ['hist', 'enigma', 'crypta'],
  pingouin: ['sym', 'aes', 'modes', 'integ'],
  sel: ['hash', 'pwd', 'salt'],
  garde: ['hmac', 'timing'],
  kasiski: ['hist', 'vigenere', 'subst', 'crypta'],
  vpn: ['vpn', 'kex', 'sym'],
};

const fr = {
  tab: 'Crypto en visuel',
  series: 'Crypto en visuel',
  tagline: 'Des idées de cryptographie racontées par de petites histoires en 3D.',
  intro: 'Chaque épisode est une histoire à suivre pas à pas, un bac à sable pour essayer, et un quiz.',
  episode: 'Épisode {n}',
  soon: 'Bientôt',
  watch: 'Voir l’épisode ▶',
  course: 'Pour le cours Cryptographie de Simon Bédard.',
  find: 'Trouver un concept :',
  all: 'Tous',
  tags: {
    canal: 'Canal peu fiable', consensus: 'Consensus', sym: 'Chiffrement symétrique', aes: 'AES', iv: 'IV',
    integ: 'Intégrité', hmac: 'HMAC', pubkey: 'Clé publique', rsa: 'RSA', kex: 'Échange de clés',
    sig: 'Signature', gcm: 'AES-GCM', replay: 'Rejeu', dh: 'Diffie-Hellman', mitm: 'Attaque de l’homme du milieu',
    hist: 'Chiffres historiques', transpo: 'Transposition', subst: 'Substitution', enigma: 'Enigma',
    crypta: 'Cryptanalyse', modes: 'Modes ECB et CBC', hash: 'Hachage', pwd: 'Mots de passe', salt: 'Sel',
    timing: 'Attaque temporelle', vigenere: 'Vigenère', vpn: 'VPN',
  },
  sagas: {
    1: ['La saga des deux généraux', 'Six épisodes, une brique chacun : le message qu’Eve ne pourra ni lire, ni changer, ni usurper.'],
    5: ['Enigma', 'La machine pas à pas : une touche d’abord, puis tout le réglage du jour, puis la casse.'],
  },
  ep: {
    'deux-generaux': ['Le problème des deux généraux', 'Peut-on se mettre d’accord quand chaque message peut se perdre ?'],
    'eve-lit-tout': ['Eve lit tout', 'Eve lit l’ordre au passage. On le chiffre avec AES : une clé neuve et un IV neuf à chaque envoi.'],
    'octet-change': ['L’octet changé', 'Eve ne sait pas lire le chiffré, mais elle peut en changer un octet. Un HMAC scelle le message.'],
    'cle-vallee': ['La clé qui traverse la vallée', 'Alice et Bob ne se sont jamais vus : comment la clé arrive-t-elle chez Bob ? Par le cadenas RSA de Bob.'],
    'paquet-complet': ['Le paquet complet', 'Toutes les briques ensemble : clés, IV, chiffré, sceau. Bob vérifie le sceau avant de déchiffrer.'],
    'encore-des-tours': ['Eve a encore des tours', 'Eve fabrique un paquet entier, ou rejoue un vrai. La signature et AES-GCM lui répondent.'],
    cadenas: ['Le cadenas de Bob', 'Tout le monde peut fermer le cadenas, seul Bob peut l’ouvrir : la clé publique.'],
    'diffie-hellman': ['Les couleurs de Diffie-Hellman', 'Deux peintures mélangées en public, un secret commun qu’Eve ne peut pas démêler. Puis Eve se glisse au milieu.'],
    scytale: ['La scytale', 'Un ruban enroulé sur un bâton : le diamètre du bâton est la clé.'],
    enigma: ['Enigma, une touche', 'On appuie sur une touche : les rotors tournent et le courant fait l’aller-retour jusqu’à une lampe.'],
    'enigma-reglage': ['Enigma, le vrai réglage', 'Les câbles, les bagues, l’encoche et le double pas, cinq rotors : tout le réglage du jour, et combien il y en a.'],
    'enigma-casse': ['Enigma, la casse', 'Une lettre n’est jamais chiffrée en elle-même, un mot deviné glisse sous le chiffré, et la bombe de Turing trouve le réglage.'],
    pingouin: ['Le pingouin et la chaîne', 'ECB laisse voir les motifs, CBC enchaîne les blocs, et un bit retourné change le message.'],
    sel: ['Le sel', 'Même mot de passe, même empreinte… sauf avec du sel. Et bcrypt prend son temps exprès.'],
    kasiski: ['La roue et le caillou', 'La clé de Vigenère tourne comme une roue, et ses traces trahissent sa longueur.'],
    garde: ['Le garde trop pressé', 'Un garde qui compare un badge lettre par lettre trahit le HMAC par son chronomètre.'],
  },
};
const en = {
  tab: 'Crypto, Visualized',
  series: 'Crypto, Visualized',
  tagline: 'Cryptography ideas told as little 3D stories.',
  intro: 'Each episode is a story to follow step by step, a sandbox to try things, and a quiz.',
  episode: 'Episode {n}',
  soon: 'Coming soon',
  watch: 'Watch the episode ▶',
  course: 'For Simon Bédard’s Cryptography course.',
  find: 'Find a concept:',
  all: 'All',
  tags: {
    canal: 'Unreliable channel', consensus: 'Consensus', sym: 'Symmetric encryption', aes: 'AES', iv: 'IV',
    integ: 'Integrity', hmac: 'HMAC', pubkey: 'Public key', rsa: 'RSA', kex: 'Key exchange',
    sig: 'Signature', gcm: 'AES-GCM', replay: 'Replay', dh: 'Diffie-Hellman', mitm: 'Man-in-the-middle attack',
    hist: 'Historical ciphers', transpo: 'Transposition', subst: 'Substitution', enigma: 'Enigma',
    crypta: 'Cryptanalysis', modes: 'ECB and CBC modes', hash: 'Hashing', pwd: 'Passwords', salt: 'Salt',
    timing: 'Timing attack', vigenere: 'Vigenère', vpn: 'VPN',
  },
  sagas: {
    1: ['The Two Generals Saga', 'Six episodes, one brick each: the message Eve can neither read, change nor forge.'],
    5: ['Enigma', 'The machine step by step: one key press first, then the whole setting of the day, then the break.'],
  },
  ep: {
    'deux-generaux': ['The Two Generals’ Problem', 'Can two parties agree when any message may be lost?'],
    'eve-lit-tout': ['Eve Reads Everything', 'Eve reads the order on its way. Encrypt it with AES: a fresh key and a fresh IV for every message.'],
    'octet-change': ['The Changed Byte', 'Eve cannot read the ciphertext, but she can change one byte of it. An HMAC seals the message.'],
    'cle-vallee': ['The Key That Crosses the Valley', 'Alice and Bob have never met: how does the key reach Bob? Through Bob’s RSA padlock.'],
    'paquet-complet': ['The Whole Packet', 'All the bricks together: keys, IV, ciphertext, seal. Bob checks the seal before he decrypts.'],
    'encore-des-tours': ['Eve Has More Tricks', 'Eve forges a whole packet, or replays a real one. Signatures and AES-GCM answer her.'],
    cadenas: ['Bob’s Padlock', 'Anyone can snap the padlock shut, only Bob can open it: public-key cryptography.'],
    'diffie-hellman': ['Diffie-Hellman’s Colours', 'Two paints mixed in public, a shared secret Eve cannot unmix. Then Eve steps into the middle.'],
    scytale: ['The Scytale', 'A strip wound around a stick: the stick’s diameter is the key.'],
    enigma: ['Enigma, One Key Press', 'Press one key: the rotors step and the current runs there and back to a lamp.'],
    'enigma-reglage': ['Enigma, the Real Setting', 'Cables, rings, the notch and the double step, five rotors: the whole setting of the day, and how many there are.'],
    'enigma-casse': ['Enigma, the Break', 'A letter never encrypts to itself, a guessed word moves along under the cipher, and Turing’s bombe finds the setting.'],
    pingouin: ['The Penguin and the Chain', 'ECB shows the patterns, CBC chains the blocks, and one flipped bit changes the message.'],
    sel: ['Salt', 'Same password, same hash… unless it is salted. And bcrypt is slow on purpose.'],
    kasiski: ['The Wheel and the Stone', 'The Vigenère key turns like a wheel, and its tracks give its length away.'],
    garde: ['The Hasty Guard', 'A guard who checks a badge letter by letter gives the HMAC away to a stopwatch.'],
  },
};

const dicts = { fr, en };
const fromUrl = new URLSearchParams(location.search).get('lang');
let lang = (fromUrl || localStorage.getItem('dg-lang') || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
const t = (k, n) => (dicts[lang][k] ?? fr[k]).replace('{n}', n);
const label = k => dicts[lang].tags[k] ?? fr.tags[k];
let tag = new URLSearchParams(location.search).get('tag');

// the tag bar: every concept an episode on the page shows, A to Z, with how many episodes show it
function renderTags() {
  const count = {};
  for (const e of EPISODES) for (const k of TAGS[e.slug] ?? []) count[k] = (count[k] ?? 0) + 1;
  if (!count[tag]) tag = null;
  const keys = Object.keys(count).sort((a, b) => label(a).localeCompare(label(b), lang));
  const chip = (k, text) => `<button data-tag="${k}" class="${(k || null) === tag ? 'on' : ''}">${text}</button>`;
  document.getElementById('tags').innerHTML = `<span>${t('find')}</span>`
    + chip('', t('all')) + keys.map(k => chip(k, `${label(k)} <small>${count[k]}</small>`)).join('');
  for (const b of document.querySelectorAll('#tags button')) b.onclick = () => {
    tag = b.dataset.tag || null;
    const u = new URL(location); tag ? u.searchParams.set('tag', tag) : u.searchParams.delete('tag');
    history.replaceState(null, '', u); render();
  };
  const bar = document.getElementById('tags'), on = bar.querySelector('.on');   // a phone scrolls the bar: show the chosen one
  if (on && bar.scrollWidth > bar.clientWidth) bar.scrollLeft = on.offsetLeft - (bar.clientWidth - on.offsetWidth) / 2;
}

// a card whose episode does not show the chosen concept is hidden, and a saga with none left too
function filter() {
  for (const c of document.querySelectorAll('#episodes .card'))
    c.hidden = !!tag && !(TAGS[c.id] ?? []).includes(tag);
  for (const s of document.querySelectorAll('#episodes .saga'))
    s.hidden = ![...s.querySelectorAll('.card')].some(c => !c.hidden);
}

function render() {
  document.documentElement.lang = lang;
  document.title = t('tab');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const b of document.querySelectorAll('#lang button')) b.classList.toggle('active', b.dataset.lang === lang);
  const q = '?lang=' + lang;
  const card = e => {
    const [title, line] = dicts[lang].ep[e.slug] ?? fr.ep[e.slug];
    const head = `<div class="art">${e.live ? `<img src="${e.slug}/vignette.jpg" alt="">` : `<span class="icon">${e.icon}</span>`}</div>
      <div class="text"><span class="num">${t('episode', e.n)}</span><h2>${title}</h2><p>${line}</p>
      <span class="chips">${(TAGS[e.slug] ?? []).map(k => `<span class="${k === tag ? 'on' : ''}">${label(k)}</span>`).join('')}</span>
      <span class="${e.live ? 'go' : 'soon'}">${e.live ? t('watch') : t('soon')}</span></div>`;
    return e.live
      ? `<a class="card live" id="${e.slug}" href="${e.slug}/${q}">${head}</a>`
      : `<div class="card soon" id="${e.slug}">${head}</div>`;
  };
  // A saga is one block where its first episode would be: its title, the first card, the rest beside it.
  const html = [], seen = new Set();
  for (const e of EPISODES) {
    if (!e.saga) { html.push(card(e)); continue; }
    if (seen.has(e.saga)) continue;
    seen.add(e.saga);
    const [first, ...rest] = EPISODES.filter(x => x.saga === e.saga), [name, line] = dicts[lang].sagas?.[e.saga] ?? fr.sagas[e.saga];
    html.push(`<section class="saga"><div class="saga-head"><span class="num">${t('episode', e.saga)}</span><h2>${name}</h2><p>${line}</p></div>
      <div class="saga-cards">${card(first)}<div class="saga-rest">${rest.map(card).join('')}</div></div></section>`);
  }
  renderTags();
  document.getElementById('episodes').innerHTML = html.join('');
  filter();
  const target = document.getElementById(location.hash.slice(1));
  if (target) target.classList.add('flash');
}

document.querySelectorAll('#lang button').forEach(b => b.onclick = () => {
  lang = b.dataset.lang; localStorage.setItem('dg-lang', lang); render();
});
render();
window.demo = { ready: true };   // tools/shoot.py waits for it
