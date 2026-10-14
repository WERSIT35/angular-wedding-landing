/**
 * The original photos are 4–7k px JPGs (2–5 MB each). For the ones we ship optimised
 * copies of (public/assets/images/opt), serve a WebP srcset instead. Any other src
 * (e.g. a photo an admin added later) falls back to the original file.
 */
const OPTIMISED = new Set(['L2D100242', 'L2D10028', 'L2D100436', 'L2D100446']);
const WIDTHS = [640, 1080, 1600, 2400] as const;

function optimisedName(src: string): string | null {
  const match = /\/assets\/images\/([A-Za-z0-9_-]+)\.(?:jpe?g|JPE?G)$/.exec(src);
  return match && OPTIMISED.has(match[1]) ? match[1] : null;
}

export function photoSrcset(src: string): string | null {
  const name = optimisedName(src);
  return name ? WIDTHS.map((w) => `/assets/images/opt/${name}-${w}.webp ${w}w`).join(', ') : null;
}

/** A mid-size WebP for the plain src (browsers without srcset, crawlers). */
export function photoSrc(src: string): string {
  const name = optimisedName(src);
  return name ? `/assets/images/opt/${name}-1080.webp` : src;
}
