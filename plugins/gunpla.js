import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GUNPLA_DIR = path.join(ROOT, "public", "images", "gunpla");
const REVIEWS_DIR = path.join(ROOT, "public", "gunpla-reviews");
const KIT_DIR = path.join(ROOT, "gunpla");
const TEMPLATE_PATH = path.join(KIT_DIR, "kit.template.html");

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

export function slugToTitle(slug) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function scanGunplaKits() {
  if (!fs.existsSync(GUNPLA_DIR)) return [];

  const entries = fs.readdirSync(GUNPLA_DIR, { withFileTypes: true });
  const folders = new Set(
    entries.filter((e) => e.isDirectory()).map((e) => e.name),
  );
  const covers = entries.filter((e) => e.isFile() && IMAGE_EXT.test(e.name));

  const kits = covers.map((entry) => {
    const cover = entry.name;
    const slug = cover.replace(IMAGE_EXT, "");
    let images = [];
    if (folders.has(slug)) {
      const folderPath = path.join(GUNPLA_DIR, slug);
      images = fs
        .readdirSync(folderPath)
        .filter((name) => IMAGE_EXT.test(name))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
    const hasReview = fs.existsSync(
      path.join(REVIEWS_DIR, `${slug}.html`),
    );
    return { slug, title: slugToTitle(slug), cover, images, hasReview };
  });

  kits.sort((a, b) => a.title.localeCompare(b.title));
  return kits;
}

/** Kits that have a review page — shown on the index gallery for now. */
export function publishedGunplaKits(kits = scanGunplaKits()) {
  return kits.filter((k) => k.hasReview);
}

export function writeKitPages(kits) {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Missing gunpla kit template: ${TEMPLATE_PATH}`);
  }
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");
  fs.mkdirSync(KIT_DIR, { recursive: true });

  const published = publishedGunplaKits(kits);
  const slugs = new Set(published.map((k) => k.slug));

  for (const kit of published) {
    const html = template
      .replaceAll("{{SLUG}}", kit.slug)
      .replaceAll("{{TITLE}}", kit.title);
    fs.writeFileSync(path.join(KIT_DIR, `${kit.slug}.html`), html, "utf8");
  }

  for (const name of fs.readdirSync(KIT_DIR)) {
    if (!name.endsWith(".html") || name === "kit.template.html") continue;
    const slug = name.replace(/\.html$/i, "");
    if (!slugs.has(slug)) fs.unlinkSync(path.join(KIT_DIR, name));
  }
}

export function gunplaRollupInputs() {
  const kits = publishedGunplaKits(scanGunplaKits());
  writeKitPages(scanGunplaKits());
  const inputs = {};
  for (const kit of kits) {
    inputs[`gunpla_${kit.slug}`] = path.join(KIT_DIR, `${kit.slug}.html`);
  }
  return inputs;
}

export function gunplaVitePlugin() {
  return {
    name: "gunpla-pages",
    enforce: "pre",
    configureServer() {
      writeKitPages(scanGunplaKits());
    },
    buildStart() {
      writeKitPages(scanGunplaKits());
    },
    resolveId(id) {
      if (id === "virtual:gunpla-manifest") return "\0virtual:gunpla-manifest";
    },
    load(id) {
      if (id === "\0virtual:gunpla-manifest") {
        return `export default ${JSON.stringify(scanGunplaKits())};`;
      }
    },
  };
}
