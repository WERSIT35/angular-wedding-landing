/**
 * The Georgian faces on this site (Barata, Sanet) are keyboard fonts: they draw Georgian
 * letters on Latin keys, e.g. "qarTveli" renders as ქართველი. Capitals matter
 * (T = თ, t = ტ; S = შ; C = ჩ; Z = ძ; W = ჭ; R = ღ; J = ჟ).
 *
 * Write Georgian copy in Georgian script and pass it through toKaKeys(); never hand-type
 * the key form ("tseremonia" is wrong, "ceremonia" is right, and this does it for you).
 */
const KEYS: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 'T', ი: 'i', კ: 'k', ლ: 'l',
  მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'J', რ: 'r', ს: 's', ტ: 't', უ: 'u', ფ: 'f', ქ: 'q',
  ღ: 'R', ყ: 'y', შ: 'S', ჩ: 'C', ც: 'c', ძ: 'Z', წ: 'w', ჭ: 'W', ხ: 'x', ჯ: 'j', ჰ: 'h'
};

export function toKaKeys(text: string): string {
  let out = '';
  for (const char of text) {
    out += KEYS[char] ?? char;
  }
  return out;
}
