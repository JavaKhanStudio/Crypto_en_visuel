// Paint as recipes. A recipe is the list of base paints poured into a pot, written as its
// letters in sorted order: 'J' JAUNE, 'R' ROUGE, 'B' BLEU, 'N' NOIR, 'W' BLANC; 'JR' is
// JAUNE + ROUGE, 'BJJR' is ORANGE + VERT. A pot's colour comes from its recipe alone, so two
// pots with the same recipe always look the same, whatever order it was poured in.
import * as THREE from 'three';

// base pigments, sRGB 0..1
const BASE = { J: [1, .8, .08], R: [.86, .1, .1], B: [.1, .3, .86], N: [.05, .05, .06], W: [.95, .95, .95] };
// the slide's colours, drawn a little brighter than the plain mix would give
const VIVID = { J: '#ffcc1a', R: '#d8262e', B: '#2a62d6', JR: '#ff8a1c', BJ: '#3e9e3a', BJR: '#7a4626' };

export const mix = (...recipes) => recipes.join('').split('').sort().join('');

const cache = new Map();
// Mixing paint is subtractive: each pigment keeps a share of the light, so the mix is the
// geometric mean of its pigments, channel by channel.
export function colorOf(recipe) {
  if (cache.has(recipe)) return cache.get(recipe);
  const c = new THREE.Color();
  if (VIVID[recipe]) c.set(VIVID[recipe]);
  else if (recipe) {
    const rgb = [0, 1, 2].map(k => Math.exp([...recipe].reduce((s, p) => s + Math.log(BASE[p][k]), 0) / recipe.length));
    c.setRGB(...rgb, THREE.SRGBColorSpace);
  }
  cache.set(recipe, c);
  return c;
}
export const cssOf = recipe => recipe ? '#' + colorOf(recipe).getHexString(THREE.SRGBColorSpace) : 'transparent';
