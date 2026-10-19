// La roue et le caillou (r120): the arithmetic of kasiski/js/kasiski.js against the course deck's
// figures (slides « Kasiski - Le chiffré » to « Les 5 colonnes », computed there by cryptographie
// verif/r24/calc/kas2.py), and every figure the story writes in kasiski/js/i18n.js (fr and en) and
// the quiz in kasiski/js/quiz-data.js against that arithmetic: change a figure in the text and this says so.
//     node tests/kasiski_values.mjs
globalThis.location = { search: '' };
globalThis.localStorage = { getItem: () => null, setItem() {} };
const K = await import('../kasiski/js/kasiski.js');
const { DICTS } = await import('../kasiski/js/i18n.js');
const { QUIZ } = await import('../kasiski/js/quiz-data.js');

let bad = 0;
const ok = (cond, what) => { console.log((cond ? 'ok   ' : 'FAIL ') + what); if (!cond) bad++; };
const eq = (a, b, what) => ok(JSON.stringify(a) === JSON.stringify(b), `${what}: ${JSON.stringify(a)}${JSON.stringify(a) === JSON.stringify(b) ? '' : ' != ' + JSON.stringify(b)}`);

// ---------- the deck ----------
// the ciphertext as the deck prints it, 30 letters a line
const GRID = ['WIOVVQJDSZPRFRRGMSSAPVQOEPWUGG', 'PXDCVDWUSPWIEDNCGQEHPPMARXIXSG', 'EVQBROSZBRAEEHBFNAIEDPMARXIXSG',
  'EVQQUTJRFRPTAIEEEZHYLGXSFPVQDR', 'EIQHDFEZRHYQAHQFQQGFLKQFRGMQBG', 'LYYSZPIZREZMFRRWEOZRTPDSITIZHP',
  'SMRTEPHQZNXIYSSLGABVWWGTSTXPCA', 'NHQQUPVOVRCPQGTCSGDRDHQZREXDSF', 'BYUGRCIBSGPRFRNYWXSPSMRTEPIFRR',
  'XIEIEPVXOQTWFOANIQBGCIQIKNIFHR', 'OMEHNYGQSFEYZAHWXUDYPHQZNWSZUH', 'PYDRRWEOZRPXXOYZRSIRFVPSYLGXSR',
  'DXXSAZQNFRBYURVGMESYPTXIFOIOSF', 'OMEHNYGQG'];
eq(K.TEXT.length, 399, 'the text has 399 letters');
eq(K.CIPHER, GRID.join(''), 'the ciphertext is the deck\'s, letter for letter');
eq(K.vigenere('ATTACKATDAWN', 'LEMON'), 'LXFOPVEFRNHR', 'ATTACKATDAWN with LEMON (the textbook vector)');
eq([K.TEXT.slice(51, 63), K.TEXT.slice(81, 93)], ['LAMEMELETTRE', 'LAMEMELETTRE'], 'LA MEME LETTRE at 51 and 81');
eq([K.CIPHER.slice(51, 63), K.CIPHER.slice(81, 93)], ['PMARXIXSGEVQ', 'PMARXIXSGEVQ'], 'both encrypt to PMARXIXSGEVQ');
const reps = K.repeats(K.CIPHER), ds = reps.map(r => r.d);
eq(ds.length, 48, '48 trigram distances');
eq(K.counts(ds).map(c => c.n), [36, 24, 9, 44, 20, 6, 7], 'lengths 2..8 divide 36 24 9 44 20 6 7');
eq(ds.filter(d => d % 5).sort((a, b) => a - b), [37, 76, 86, 154], 'the 4 distances 5 misses');
eq(K.best(K.counts(ds)).L, 5, 'the length kept is 5');
const row = t => { const r = reps.find(x => x.tri === t); return [r.a, r.b, r.d]; };
eq(['PMA', 'HQZ', 'OME', 'QQU', 'YLG', 'IED', 'RFR'].map(row), [[51, 81, 30], [186, 231, 45], [300, 390, 90], [92, 212, 120], [109, 354, 245], [41, 78, 37], [11, 97, 86]], 'the deck\'s table of 7');
const cols = K.columns(K.CIPHER, 5);
eq(cols.map(c => c.top).join(''), 'PIQSR', 'column tops P I Q S R');
eq(cols.map(c => c.key).join(''), 'LEMON', 'minus E: LEMON');
eq([cols[0].n, cols[0].col.length], [17, 80], 'P comes up 17 times in 80 in column 1');
eq(K.repeats(K.CIPHER).filter(r => r.b + 3 <= 96).length, 11, 'inside the lane (0..95): 11 repeats');
// the tyre: 205/55 R16 -> rim 16 in, sidewall 55 % of 205 mm
const circ = Math.PI * (16 * 25.4 + 2 * .55 * 205) / 1000;
ok(Math.abs(circ - 2) < .02, `a 205/55 R16 is ${circ.toFixed(3)} m around: about 2 m`);

// ---------- the wheel ----------
const g = K.gaps(K.track(K.WHEEL)), gd = g.map(x => x.d);
eq(gd, [400, 600, 400, 1000, 370, 230, 400, 1000, 600, 400, 760, 240, 600, 400], 'the 14 gaps of the story\'s road (cm)');
eq(K.wheelCounts(gd).map(c => c.n), [3, 10, 2, 3, 0, 5], '1.5 2 2.5 3 3.5 4 m divide 3 10 2 3 0 5');
eq(K.best(K.wheelCounts(gd)).L, 200, 'the step kept is 2 m');
eq(gd.filter(d => d % 200), [370, 230, 760, 240], 'the gravel gaps 3.7 2.3 7.6 2.4');
for (const C of [150, 200, 250, 300]) for (const n of [0, 2, 4, 6]) {
  const r = K.randomRoad(C, n, 7 + C + n * 31);
  ok(K.best(K.wheelCounts(K.gaps(K.track(r)).map(x => x.d))).L === C, `sandbox road ${C} cm, ${n} gravel: the turn comes back`);
}

// ---------- the words ----------
for (const lang of ['fr', 'en']) {
  const S = DICTS[lang].steps, m = cm => K.metres(cm, lang === 'en' ? '.' : ','), has = (id, s) => ok(S[id].p.includes(s), `${lang} ${id} says « ${s} »`);
  const L = (fr, en) => lang === 'fr' ? fr : en;
  const wc = Object.fromEntries(K.wheelCounts(gd).map(c => [c.L, c.n]));
  has('s4', L('4, 6 ou 10 m', '4, 6 or 10 m'));
  has('s5', L(`${m(370)} et ${m(230)}, puis ${m(760)} et ${m(240)}`, `${m(370)} and ${m(230)}, then ${m(760)} and ${m(240)}`));
  has('s6', L(`des ${gd.length} écarts`, `of the ${gd.length} gaps`));
  has('s6', L(`2 m en divise ${wc[200]}`, `2 m divides ${wc[200]}`));
  has('s6', L(`4 m n’en divise que ${wc[400]}, 3 m et 1,5 m que ${wc[300]}`, `4 m divides only ${wc[400]}, 3 m and 1.5 m only ${wc[300]}`));
  ok(wc[300] === wc[150], `${lang} s6: 3 m and 1.5 m divide as many (${wc[300]})`);
  has('s7', L('L + L donne W, E + E donne I, C + M donne O', 'L + L gives W, E + E gives I, C + M gives O'));
  ok(K.vigenere('LEC', 'LEM') === 'WIO', `${lang} s7: L+L, E+E, C+M = W, I, O`);
  has('s8', 'PMARXIXSGEVQ'); has('s8', '30 = 5 × 6'); has('s8', L('position 51 et à la position 81', 'position 51 and at position 81'));
  has('s9', L(`${ds.length} distances`, `${ds.length} distances`)); has('s9', L('37 lettres plus loin', '37 letters further on'));
  has('s9', `${K.CIPHER.length}`);
  has('s10', L(`5 en divise ${K.counts(ds)[3].n}`, `5 divides ${K.counts(ds)[3].n}`));
  has('s10', L('37, 76, 86 et 154', '37, 76, 86 and 154'));
  has('s10', L(`2 suit avec ${K.counts(ds)[0].n}`, `2 comes next with ${K.counts(ds)[0].n}`));
  ok(45 % 2 && 245 % 2 && !(30 % 2) && !(90 % 2) && !(120 % 2), `${lang} s10: 2 misses 45 and 245, divides 30 90 120`);
  has('s11', L(`P sort ${cols[0].n} fois sur ${cols[0].col.length}`, `P comes up ${cols[0].n} times in ${cols[0].col.length}`));
  has('s11', L('le décalage est de 11, la lettre L', 'the shift is 11, the letter L'));
}
// the quiz's figures
const qd = [30, 45, 90, 37, 245, 120];
eq([3, 5, 15, 37].map(L => qd.filter(d => d % L === 0).length), [4, 5, 4, 1], 'quiz 2: 3, 5, 15, 37 divide 4, 5, 4, 1 of the distances');
ok(QUIZ[1].correct[0] === 1 && QUIZ[1].fr.o[1] === '5', 'quiz 2: the answer is 5');
ok(26 ** 5 === 11881376 && QUIZ[4].fr.ko.includes('11 881 376') && QUIZ[4].en.ko.includes('11,881,376'), 'quiz 5: 26^5 = 11 881 376 keys of 5 letters');
console.log(bad ? `${bad} failed` : 'all ok');
process.exit(bad ? 1 : 0);
