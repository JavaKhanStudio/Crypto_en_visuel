// The slide « Enigma - À la main » (r24s03), row by row, against enigma/js/enigma.js. node tests/enigma_values.mjs
import { press, type, step } from '../enigma/js/enigma.js';
const rows = [['O', 'AAA', 'DKNKBJT'], ['O', 'AAB', 'GRUCYVI'], ['U', 'AAA', 'LHQEAAZ'], ['U', 'AAB', 'SZJXQQV']];
let bad = 0;
const check = (name, got, want) => { const ok = got === want; ok || bad++; console.log(ok ? 'ok  ' : 'FAIL', name, got, ok ? '' : `(want ${want})`); };
for (const [k, pos, want] of rows) check(`${k} ${pos}`, press(k, pos).path.join(''), want);
check('OUI from AAA', type('OUI', 'AAA').map(r => r.lamp).join(''), 'TVG');
check('TVG from AAA', type('TVG', 'AAA').map(r => r.lamp).join(''), 'OUI');
check('O at AAB steps to', press('O', 'AAB').pos, 'AAC');
// the stepping of Enigma I: III's notch V, the double step of II at E
check('AAV', step('AAV'), 'ABW'); check('ADU', step('ADU'), 'ADV'); check('ADV', step('ADV'), 'AEW'); check('AEW', step('AEW'), 'BFX');
// a known test vector: AAA, AAAAA -> BDZGO
check('AAAAA', type('AAAAA', 'AAA').map(r => r.lamp).join(''), 'BDZGO');
process.exit(bad ? 1 : 0);
