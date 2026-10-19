// Episode 5.2 « Le vrai réglage »: enigma-reglage/js/enigma.js against published Enigma I test
// vectors first (D4: never only against our own output), then the episode's own values, and the
// figures the story writes out in enigma-reglage/js/i18n.js. node tests/enigma-reglage_values.mjs
import { readFileSync } from 'node:fs';
import { press, type, step, lamps, cableWays, cableSteps, ORDERS, STARTS, TOTAL, BARE } from '../enigma-reglage/js/enigma.js';
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got, ok ? '' : `(want ${want})`); };

// --- published vectors ---
// Enigma I, rotors I II III, reflector B, rings AAA, start AAA: AAAAA -> BDZGO (the classic check)
check('I II III, rings AAA, AAA: AAAAA', lamps('AAAAA', 'AAA', BARE), 'BDZGO');
// the same with rings BBB: AAAAA -> EWTYX (the classic ring-setting check)
check('I II III, rings BBB, AAA: AAAAA', lamps('AAAAA', 'AAA', { ...BARE, rings: 'BBB' }), 'EWTYX');
// the Barbarossa message of 7 July 1941 (Enigma I, rotors II IV V, rings B U L, ten cables, start
// BLA): its first 41 letters decrypt to « AUFKL XABTE ILUNG XVONX KURTI NOWAX KURTI NOWAX N(ORDW…) »
const barbarossa = { rotors: ['II', 'IV', 'V'], rings: 'BUL', plugs: 'AV BS CG DL FU HZ IN KM OW RX' };
check('Barbarossa, II IV V, BUL, BLA', lamps('EDPUDNRGYSZRCXNUYTPOMRMBOFKTBZREZKMLXLVEF', 'BLA', barbarossa), 'AUFKLXABTEILUNGXVONXKURTINOWAXKURTINOWAXN');
// the stepping of Enigma I: III's notch V, the double step of II at E; IV's J and V's Z
check('step AAV', step('AAV'), 'ABW'); check('step ADU', step('ADU'), 'ADV'); check('step ADV', step('ADV'), 'AEW'); check('step AEW', step('AEW'), 'BFX');
check('step IV right at J', step('AAJ', ['I', 'II', 'IV']), 'ABK'); check('step V right at Z', step('AAZ', ['I', 'II', 'V']), 'ABA');
// the plugboard count, 26! / (6! 10! 2^10), and the usual total without the rings
check('10 cables', cableWays(10), 150738274937250n);
check('cable by cable = closed form', cableSteps(10).at(-1).ways, cableWays(10));
check('total', TOTAL, 158962555217826360000n);

// --- the episode's own values ---
const CAB = { ...BARE, plugs: 'BS CZ DN ER FI GU HO KW LM QY' }, DAY = { ...CAB, rings: 'AAB' };
const row = r => `${r.key} ${r.from} ${r.in} ${r.path.join('')} ${r.lamp}`;
check('5.1: O at AAA', row(press('O', 'AAA')), 'O AAA O DKNKBJT T');
check('cables: O at AAA', row(press('O', 'AAA', CAB)), 'O AAA H QQXJZSI F');
check('cables: F at AAA', row(press('F', 'AAA', CAB)), 'F AAA I SZJXQQH O');
check('ring B: O at AAA', row(press('O', 'AAA', DAY)), 'O AAA H PCMOMOZ C');
const msg = type('OUI', 'ADU', DAY);
check('OUI from ADU', msg.map(row).join(' | '), 'O ADU H JTPIVSB S | U ADV G ISSFDHL M | I AEW F HRRBXKW K');
check('OUI steps', msg.map(r => r.pos).join(' '), 'ADV AEW BFX');
check('SMK from ADU', lamps('SMK', 'ADU', DAY), 'OUI');
check('no letter to itself', [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].some(c => press(c, 'ADU', DAY).lamp === c), false);
check('orders', ORDERS, 60); check('starts', STARTS, 17576); check('orders × starts', ORDERS * STARTS, 1054560);
check('years at a million a second', Math.round(Number(TOTAL) / 1e6 / (365.25 * 86400) / 1e6), 5);

// --- the figures the story writes, in both languages ---
const text = readFileSync(new URL('../enigma-reglage/js/i18n.js', import.meta.url), 'utf8');
const fr = text.slice(text.indexOf('const fr'), text.indexOf('const en')), en = text.slice(text.indexOf('const en'), text.indexOf('const dicts'));
const has = (name, dict, ...bits) => check(name, bits.filter(b => !dict.includes(b)).join(', ') || 'all there', 'all there');
has('fr figures', fr, '17 576', '1 054 560', '150 738 274 937 250', '158 962 555 217 826 360 000', '1,59 × 10²⁰', '325', '276', '26 × 26 = 676', 'SMK', 'AEW', 'BFX', 'P, C, M, le réflecteur, O, M, O, Z', 'S, Z, J, X, Q, Q, H', 'cinq millions');
has('en figures', en, '17,576', '1,054,560', '150,738,274,937,250', '158,962,555,217,826,360,000', '1.59 × 10²⁰', '325', '276', '26 × 26 = 676', 'SMK', 'AEW', 'BFX', 'P, C, M, the reflector, O, M, O, Z', 'S, Z, J, X, Q, Q, H', 'five million');
process.exit(bad ? 1 : 0);
