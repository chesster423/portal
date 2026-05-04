/** Poster art: `public/images/{basename}.jpg` with fallbacks (roman → arabic, title slug vs id) and `<img>` swap on 404. */

import { slugFromTitle } from "./slug.js";

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h) % 360;
}

/** Longest roman suffix first (e.g. -xi before -x). */
const ROMAN_SUFFIXES = [
  ["xiii", "13"],
  ["xii", "12"],
  ["xi", "11"],
  ["iii", "3"],
  ["viii", "8"],
  ["vii", "7"],
  ["ix", "9"],
  ["iv", "4"],
  ["vi", "6"],
  ["ii", "2"],
  ["x", "10"],
  ["v", "5"],
  ["i", "1"],
];

export function romanTailToNumberSlug(slug) {
  const s = String(slug || "").toLowerCase();
  for (const [roman, num] of ROMAN_SUFFIXES) {
    const suf = `-${roman}`;
    if (s.endsWith(suf)) {
      const base = slug.slice(0, slug.length - roman.length - 1);
      return `${base}-${num}`;
    }
  }
  return null;
}

function normalizeBaseUrl(base) {
  return String(base || "/").replace(/\/*$/, "/");
}

export function posterJpgUrl(basename, base) {
  const b = String(basename || "")
    .trim()
    .replace(/\\/g, "");
  if (!b) return `${normalizeBaseUrl(base)}images/unknown.jpg`;
  return `${normalizeBaseUrl(base)}images/${encodeURIComponent(b)}.jpg`;
}

/**
 * Ordered unique JPG URLs to try (sheet id, title slug, roman→digit variants).
 * @param {{ id?: string, title?: string }} review
 */
export function posterCandidateUrls(review, base) {
  const id = String(review?.id ?? "").trim();
  const tslug = slugFromTitle(review?.title ?? "");
  const bases = [];
  if (id) bases.push(id);
  if (tslug && tslug !== id) bases.push(tslug);
  const n1 = romanTailToNumberSlug(id);
  if (n1 && !bases.includes(n1)) bases.push(n1);
  const n2 = romanTailToNumberSlug(tslug);
  if (n2 && !bases.includes(n2)) bases.push(n2);
  const seen = new Set();
  const urls = [];
  for (const p of bases) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    urls.push(posterJpgUrl(p, base));
  }
  return urls;
}

/** Hue gradient behind poster image (or alone if every JPG fails). */
export function posterFallbackStyle(id) {
  const key = String(id ?? "").trim() || "review";
  const h1 = hashHue(key);
  const h2 = (h1 + 42) % 360;
  return `background: linear-gradient(135deg, hsl(${h1}, 70%, 22%) 0%, hsl(${h2}, 65%, 12%) 100%); background-color: hsl(${h1}, 28%, 16%);`;
}

/**
 * Wire `[data-poster-urls]` images: on error, try next URL; if all fail, remove img.
 * @param {ParentNode} root
 */
export function wirePosterCandidates(root) {
  if (!root) return;
  root.querySelectorAll("img[data-poster-urls]").forEach((img) => {
    const raw = img.getAttribute("data-poster-urls");
    if (!raw) return;
    let urls;
    try {
      urls = JSON.parse(decodeURIComponent(raw));
    } catch {
      return;
    }
    if (!Array.isArray(urls) || urls.length === 0) return;

    let failed = 0;
    img.addEventListener("error", function onPosterError() {
      failed += 1;
      if (failed < urls.length) {
        img.src = urls[failed];
      } else {
        img.removeEventListener("error", onPosterError);
        img.remove();
      }
    });
  });
}
