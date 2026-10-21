// The episode's facts, in one place: the map's addresses, what each watcher reads off a packet, and
// the WireGuard values, computed here with the real algorithms of x25519.js and aead.js (never
// written by hand). No DOM: tests/vpn_values.mjs imports this file in node and checks every value
// against node:crypto and every figure the story writes against these.
import { publicKey, shared } from './x25519.js';
import { seal, open, poly1305, chachaBlock } from './aead.js';

// Addresses from the ranges set aside for documentation (RFC 5737): no real machine answers them.
export const ADDR = { cafe: '203.0.113.7', bob: '198.51.100.20', vpn: '192.0.2.44' };
export const NAME = 'bob.example';          // a name set aside for examples (RFC 2606)
// Victor's other customers (step 12, r360): each one's tunnel ends at his server too, so he reads where
// each goes. Documentation addresses and example names, like the rest.
export const OTHERS = [
  { addr: '198.51.100.61', name: 'shop.example' },
  { addr: '203.0.113.142', name: 'news.example' },
  { addr: '192.0.2.203', name: 'mail.example' },
];

// ---------- WireGuard, cut to one exchange ----------
const enc = s => new TextEncoder().encode(s);
export const hex = (b, n = b.length) => [...b.slice(0, n)].map(x => x.toString(16).padStart(2, '0')).join('');
export const spaced = (b, n = b.length) => [...b.slice(0, n)].map(x => x.toString(16).padStart(2, '0')).join(' ');
// each side's secret, 32 bytes, kept at home; X25519 makes the public half
export const SECRET = { a: enc('alice-garde-ce-secret-pour-elle!'), v: enc('le-serveur-vpn-garde-le-sien-!!!') };
export const PUBLIC = { a: publicKey(SECRET.a), v: publicKey(SECRET.v) };
// each multiplies the other's public point by its own secret: the same 32 bytes on both sides
export const KEY = { a: shared(SECRET.a, PUBLIC.v), v: shared(SECRET.v, PUBLIC.a) };
// WireGuard's nonce is the packet's number: 4 zero bytes, then the counter on 8 (0: the first packet)
export const NONCE = new Uint8Array(12);
// what the tunnel hides, cut to what fits on screen: the inner envelope's address line, Bob's address
export const PACKET = enc(ADDR.bob);
export const SEALED = seal(KEY.a, NONCE, PACKET);
// Eve flips one bit of byte FLIP on the way: the server recomputes the tag, it does not match
export const FLIP = 4;
export function flipped() { const ct = Uint8Array.from(SEALED.ct); ct[FLIP] ^= 1; return ct; }
// the tag the server computes over what it received (RFC 8439 §2.8, with no extra data)
export function tagOf(ct) {
  const pad = (16 - ct.length % 16) % 16, m = new Uint8Array(ct.length + pad + 16);
  m.set(ct); new DataView(m.buffer).setBigUint64(m.length - 8, BigInt(ct.length), true);
  return poly1305(chachaBlock(KEY.v, 0, NONCE).subarray(0, 32), m);
}
export const opened = ct => open(KEY.v, NONCE, ct, SEALED.tag);
export const SIZE = { inner: PACKET.length, sealed: SEALED.ct.length + SEALED.tag.length };

// ---------- who reads what ----------
// A watcher: 'e' Eve on the café's open Wi-Fi, 'i' the internet provider (ISP), 'v' the VPN server
// (Victor), 'b' Bob's site. A path: https (the content locked by the site's own encryption), tunnel.
// Each answer is a row of the card's table: what that watcher reads off the packets going by.
//   from:    whose address is on the envelope ('cafe' or 'vpn')
//   to:      the address it goes to ('bob' or 'vpn'), the name: the site's name (DNS and the TLS hello)
//   content: 'clear' read, 'locked' (HTTPS), or null (never passes there)
//   when:    the time and size of each packet
export function sees(who, { https = true, tunnel = false } = {}) {
  if (who === 'b') return { from: tunnel ? 'vpn' : 'cafe', to: 'bob', name: true, content: 'clear', when: true };
  if (who === 'v') return tunnel ? { from: 'cafe', to: 'bob', name: true, content: https ? 'locked' : 'clear', when: true }
    : { from: null, to: null, name: false, content: null, when: false };   // without the tunnel nothing goes through it
  // Eve and the ISP are on the way out of the café, before the tunnel ends
  return tunnel ? { from: 'cafe', to: 'vpn', name: false, content: 'sealed', when: true }
    : { from: 'cafe', to: 'bob', name: true, content: https ? 'locked' : 'clear', when: true };
}
// the stops a packet makes, laptop to Bob's site
export const route = tunnel => tunnel ? ['a', 'w', 'i', 'v', 'b'] : ['a', 'w', 'i', 'b'];
