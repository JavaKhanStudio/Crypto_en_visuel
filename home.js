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
const EPISODES = [
  { n: 1, slug: 'deux-generaux', icon: '🏰', live: true },
  { n: 2, slug: 'cadenas', icon: '🔒', live: true },
  { n: 3, slug: 'diffie-hellman', icon: '🎨', live: true },
  { n: 4, slug: 'scytale', icon: '📜', live: true },
  { n: 5, slug: 'enigma', icon: '⚙️' },
  { n: 6, slug: 'pingouin', icon: '🐧' },
  { n: 7, slug: 'sel', icon: '🧂' },
  { n: 8, slug: 'garde', icon: '⏱️' },
];

const fr = {
  tab: 'Crypto en visuel',
  series: 'Crypto en visuel',
  tagline: 'Des idées de cryptographie racontées par de petites histoires en 3D.',
  intro: 'Chaque épisode est une histoire à suivre pas à pas, un bac à sable pour essayer, et un quiz.',
  episode: 'Épisode {n}',
  soon: 'Bientôt',
  watch: 'Voir l’épisode ▶',
  course: 'Pour le cours Cryptographie de Simon Bédard.',
  ep: {
    'deux-generaux': ['Le problème des deux généraux', 'Peut-on se mettre d’accord quand chaque message peut se perdre ?'],
    cadenas: ['Le cadenas de Bob', 'Tout le monde peut fermer le cadenas, seul Bob peut l’ouvrir : la clé publique.'],
    'diffie-hellman': ['Les couleurs de Diffie-Hellman', 'Deux peintures mélangées en public, un secret commun qu’Eve ne peut pas démêler. Puis Eve se glisse au milieu.'],
    scytale: ['La scytale', 'Un ruban enroulé sur un bâton : le diamètre du bâton est la clé.'],
    enigma: ['Enigma, une touche', 'On appuie sur une touche : les rotors tournent et le courant fait l’aller-retour jusqu’à une lampe.'],
    pingouin: ['Le pingouin et la chaîne', 'ECB laisse voir les motifs, CBC enchaîne les blocs, et un bit retourné change le message.'],
    sel: ['Le sel', 'Même mot de passe, même empreinte… sauf avec du sel. Et bcrypt prend son temps exprès.'],
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
  ep: {
    'deux-generaux': ['The Two Generals’ Problem', 'Can two parties agree when any message may be lost?'],
    cadenas: ['Bob’s Padlock', 'Anyone can snap the padlock shut, only Bob can open it: public-key cryptography.'],
    'diffie-hellman': ['Diffie-Hellman’s Colours', 'Two paints mixed in public, a shared secret Eve cannot unmix. Then Eve steps into the middle.'],
    scytale: ['The Scytale', 'A strip wound around a stick: the stick’s diameter is the key.'],
    enigma: ['Enigma, One Key Press', 'Press one key: the rotors step and the current runs there and back to a lamp.'],
    pingouin: ['The Penguin and the Chain', 'ECB shows the patterns, CBC chains the blocks, and one flipped bit changes the message.'],
    sel: ['Salt', 'Same password, same hash… unless it is salted. And bcrypt is slow on purpose.'],
    garde: ['The Hasty Guard', 'A guard who checks a badge letter by letter gives the HMAC away to a stopwatch.'],
  },
};

const dicts = { fr, en };
const fromUrl = new URLSearchParams(location.search).get('lang');
let lang = (fromUrl || localStorage.getItem('dg-lang') || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
const t = (k, n) => (dicts[lang][k] ?? fr[k]).replace('{n}', n);

function render() {
  document.documentElement.lang = lang;
  document.title = t('tab');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const b of document.querySelectorAll('#lang button')) b.classList.toggle('active', b.dataset.lang === lang);
  const q = '?lang=' + lang;
  document.getElementById('episodes').innerHTML = EPISODES.map(e => {
    const [title, line] = dicts[lang].ep[e.slug] ?? fr.ep[e.slug];
    const head = `<div class="art">${e.live ? `<img src="${e.slug}/vignette.jpg" alt="">` : `<span class="icon">${e.icon}</span>`}</div>
      <div class="text"><span class="num">${t('episode', e.n)}</span><h2>${title}</h2><p>${line}</p>
      <span class="${e.live ? 'go' : 'soon'}">${e.live ? t('watch') : t('soon')}</span></div>`;
    return e.live
      ? `<a class="card live" id="${e.slug}" href="${e.slug}/${q}">${head}</a>`
      : `<div class="card soon" id="${e.slug}">${head}</div>`;
  }).join('');
  const target = document.getElementById(location.hash.slice(1));
  if (target) target.classList.add('flash');
}

document.querySelectorAll('#lang button').forEach(b => b.onclick = () => {
  lang = b.dataset.lang; localStorage.setItem('dg-lang', lang); render();
});
render();
window.demo = { ready: true };   // tools/shoot.py waits for it
