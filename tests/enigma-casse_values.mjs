// Episode 5.3 « La casse »: enigma-casse/js/enigma.js against published Enigma I test vectors first
// (D4: never only against our own output), then the break the story tells, recomputed from
// scratch (the crib's places, the five menus, the bombe's stops, the clerk's check, the reading),
// then the figures the story writes out in enigma-casse/js/i18n.js. node tests/enigma-casse_values.mjs
// The story's constants live in story.js, which imports the page's i18n; this test recomputes them.
import { readFileSync } from 'node:fs';
import { A, REFLECTOR, press, lamps, type, places, clashes, menu, menuLetters, scrambler, implied, cablesOf, bombe, check, BARE, STARTS } from '../enigma-casse/js/enigma.js';
let bad = 0;
const check_ = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got, ok ? '' : `(want ${want})`); };

// --- published vectors ---
check_('I II III, rings AAA, AAA: AAAAA', lamps('AAAAA', 'AAA', BARE), 'BDZGO');
check_('I II III, rings BBB, AAA: AAAAA', lamps('AAAAA', 'AAA', { ...BARE, rings: 'BBB' }), 'EWTYX');
const barbarossa = { rotors: ['II', 'IV', 'V'], rings: 'BUL', plugs: 'AV BS CG DL FU HZ IN KM OW RX' };
check_('Barbarossa, II IV V, BUL, BLA', lamps('EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEF', 'BLA', barbarossa), 'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXN');
// reflector B pairs its 26 contacts, none with itself
check_('reflector B: an involution without a fixed letter', [...A].every((c, i) => REFLECTOR[i] !== c && REFLECTOR[A.indexOf(REFLECTOR[i])] === c), true);
// the scrambler the bombe uses (rings A, the right rotor only) is the machine without cables, while the middle rotor stays
check_('scrambler = machine without cables', [...Array(20).keys()].every(i => [...A].every((c, x) => A[scrambler(['I', 'II', 'III'], 'IXW', i)[x]] === type('A'.repeat(i) + c, 'IXW', { ...BARE }).at(-1).lamp)), true);

// --- the message ---
const DAY = { rotors: ['I', 'II', 'III'], rings: 'AAB', plugs: 'BS CZ DN ER FI GU HO KW LM QY' }, ROT = DAY.rotors;
const PLAIN = 'HEUTEXWETTERBERICHTXEIS', CRIB = 'WETTERBERICHT', C = lamps(PLAIN, 'IXX', DAY);
check_('cipher', C, 'EBOWTASBRMHCEFBMMXEFFPA');
check_('back with the sheet', lamps(C, 'IXX', DAY), PLAIN);
const recs = type(PLAIN, 'IXX', DAY);
check_('the middle rotor never moves (the bombe assumes it)', recs.every(r => r.pos.slice(0, 2) === 'IX'), true);
check_('no letter to itself in the message', [...PLAIN].some((c, i) => C[i] === c), false);
const h = press('H', 'IXX', DAY);
check_('H at IXX', `${h.pos} ${h.in} ${h.path.join('')} ${h.lamp}`, 'IXY O YBRBRBR E');
// no letter to itself, on every key of every position of a sample
let self = 0; for (let n = 0; n < STARTS; n += 37) for (const c of A) if (press(c, A[(n / 676) | 0] + A[((n / 26) | 0) % 26] + A[n % 26], DAY).lamp === c) self++;
check_('no letter to itself, 475 positions × 26 keys', self, 0);

// --- the crib ---
check_('places left (1-based)', places(C, CRIB).map(k => k + 1).join(' '), '5 7 8 10 11');
check_('place 1 falls on letter 9, R under R', clashes(C, CRIB, 0).map(j => `${CRIB[j]}${j + 1}`).join(' '), 'R9');
check_('the true place is left', places(C, CRIB).includes(PLAIN.indexOf(CRIB)), true);
const L7 = menu(C, CRIB, 6);
check_('menu of place 7', L7.map(l => `${l.i + 1}${l.a}${l.b}`).join(' '), '7WS 8EB 9TR 10TM 11EH 12RC 13BE 14EF 15RB 16IM 17CM 18HX 19TE');
check_('its letters', menuLetters(L7).length, 12);
// the loop E -8- B -15- R -9- T -19- E at IXW
const loop = (x, pos) => { const out = [x]; for (const i of [7, 14, 8, 18]) out.push(A[scrambler(ROT, pos, i)[A.indexOf(out.at(-1))]]); return out.join(''); };
check_('loop at IXW, E→A', loop('A', 'IXW'), 'AJIGS');
check_('loop at IXW, E→R', loop('R', 'IXW'), 'RSETR');

// --- the bombe: order I II III, rings A, test letter E, the five menus ---
const stops = places(C, CRIB).flatMap(k => bombe(menu(C, CRIB, k), ROT, 'E').map(s => ({ k, ...s })));
check_('stops', stops.map(s => `${s.k + 1}:${s.pos}:${s.guess}`).join(' '), '5:DDO:U 7:IXW:R 10:AKT:J 10:CRK:K 11:BEC:Z 11:EFM:J 11:OFS:K 11:UEA:U 11:WHR:E');
// story.js keeps the same list (its run recomputes it live; its later steps start from it)
const story = readFileSync(new URL('../enigma-casse/js/story.js', import.meta.url), 'utf8');
const listed = [...story.slice(story.indexOf('export const STOPS')).matchAll(/\['(\w{3})', (\d+), '(\w)'\]/g)].slice(0, 9).map(m => `${+m[2] + 1}:${m[1]}:${m[3]}`).join(' ');
check_('story.js STOPS = the bombe', listed, stops.map(s => `${s.k + 1}:${s.pos}:${s.guess}`).join(' '));
const checks = stops.map(s => check(menu(C, CRIB, s.k), ROT, s, 'E'));
check_('stops that hold', checks.filter(c => !c.bad.length).length, 1);
const good = checks.find(c => !c.bad.length), found = good.pairs.filter(p => p[0] !== p[1]).join(' ');
check_('cables found', found, 'BS CZ ER FI HO KW LM');
check_('letters with no cable', good.pairs.filter(p => p[0] === p[1]).join(' '), 'TT XX');
check_('the found cables are the sheet\'s', found.split(' ').every(p => DAY.plugs.includes(p)), true);
check_('E→R: one cable each', cablesOf(implied(L7, ROT, 'IXW', 'E', 'R'), 'B').join(''), 'S');
const F = { rotors: ROT, rings: 'AAA', plugs: found };
check_('first reading', lamps(C, 'IXW', F), 'HEGTEXWETTERBERICHTXEIS');
check_('with G–U', lamps(C, 'IXW', { ...F, plugs: found + ' GU' }), PLAIN);
check_('ring A at IXW = ring B at IXX, letter by letter', type(PLAIN, 'IXW', { ...DAY, rings: 'AAA' }).map(r => r.lamp).join(''), C);
check_('5 menus × 17 576', 5 * STARTS, 87880);

// --- the figures the story writes, in both languages ---
const text = readFileSync(new URL('../enigma-casse/js/i18n.js', import.meta.url), 'utf8');
const fr = text.slice(text.indexOf('const fr'), text.indexOf('const en')), en = text.slice(text.indexOf('const en'), text.indexOf('const dicts'));
const has = (name, dict, ...bits) => check_(name, bits.filter(b => !dict.includes(b)).join(', ') || 'all there', 'all there');
const both = ['IXX', 'IXY', 'IXW', 'HEUTEXWETTERBERICHTXEIS', 'EBOWTASBRMHCEFBMMXEFFPA', 'HEGTEXWETTERBERICHTXEIS', 'WETTERBERICHT', '1, 2, 3, 4, 6', '5, 7, 8, 10', 'R, B, R'];
has('fr figures', fr, ...both, '9e lettre', '17 576', '87 880', '9 arrêts', 'Huit arrêts', 'B–S, C–Z, F–I, H–O, K–W et L–M', 'en J', 'en I', 'en G', 'en S', '60 ordres', '1,59 × 10²⁰');
has('en figures', en, ...both, '9th letter', '17,576', '87,880', '9 stops', 'Eight stops', 'B–S, C–Z, F–I, H–O, K–W and L–M', 'at J', 'I;', 'G;', 'at S', '60 orders', '1.59 × 10²⁰');
process.exit(bad ? 1 : 0);
