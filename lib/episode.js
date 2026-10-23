// r340 (r315, Simon's answer A): the one boot module every episode loads. A feature the whole series
// shares reaches every episode through here, in one place, instead of one ticket per episode folder.
// An episode's js/main.js imports it once, in place of new EffectComposer(renderer):
//     import { qualityComposer } from '../../lib/episode.js';
//     const composer = qualityComposer(renderer);
// Loading it brings:
//   - the credit stamp (credit.js at the root, r185): in an episode, Simon's logo alone on the title chip's crest (r340);
//   - the picture quality (lib/quality.js, r254/r310): the MSAA composer and its Éco / HD / HD+ button;
//   - addBloom(composer, strength, radius, threshold) (lib/bloom.js, r548): the series' glow and the output pass;
//   - the top bar out of the way (r406, lib/topbar.js): it fades and slides away from the mouse, tucks behind a tab on a phone,
//     and the scene takes its room back; ?topbar=pin keeps it shown.
// A new series-wide feature is one more import here, never a line in each episode.
import '../credit.js';
import './topbar.js';
export { qualityComposer } from './quality.js';
export { addBloom } from './bloom.js';   // r548: the glow without its full-screen MSAA blend
