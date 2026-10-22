// r340 (r315, Simon's answer A): the one boot module every episode loads. A feature the whole series
// shares reaches every episode through here, in one place, instead of one ticket per episode folder.
// An episode's js/main.js imports it once, in place of new EffectComposer(renderer):
//     import { qualityComposer } from '../../lib/episode.js';
//     const composer = qualityComposer(renderer);
// Loading it brings:
//   - the credit stamp (credit.js at the root, r185): in an episode, Simon's logo alone on the title chip's crest (r340);
//   - the picture quality (lib/quality.js, r254/r310): the MSAA composer and its Éco / HD / HD+ button.
// A new series-wide feature is one more import here, never a line in each episode.
import '../credit.js';
export { qualityComposer } from './quality.js';
