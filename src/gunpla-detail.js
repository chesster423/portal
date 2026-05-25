import manifest from "virtual:gunpla-manifest";
import {
  buildGunplaLightbox,
  gunplaCoverUrl,
  gunplaImageUrl,
  gunplaReviewUrl,
  mountGunplaGallery,
} from "./gunpla-shared.js";

function getKitSlug() {
  const fromHtml = document.documentElement.dataset.kit;
  if (fromHtml) return fromHtml;
  const match = location.pathname.match(/\/gunpla\/([^/]+)\.html$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

async function loadReview(slug) {
  const mount = document.getElementById("gunpla-kit-review");
  if (!mount) return;

  try {
    const res = await fetch(gunplaReviewUrl(slug));
    if (!res.ok) {
      mount.hidden = true;
      return;
    }
    const html = await res.text();
    mount.innerHTML = html.trim();
    mount.hidden = false;
  } catch {
    mount.hidden = true;
  }
}

function main() {
  const slug = getKitSlug();
  const kit = manifest.find((k) => k.slug === slug);
  const mount = document.getElementById("gunpla-kit-gallery");
  if (!mount || !kit) return;

  loadReview(slug);

  const { openLightbox } = buildGunplaLightbox();

  const galleryFiles =
    kit.images.length > 0
      ? kit.images.map((file) => ({ file, inFolder: true }))
      : [{ file: kit.cover, inFolder: false }];

  const items = galleryFiles.map(({ file, inFolder }) => {
    const src = inFolder ? gunplaImageUrl(kit.slug, file) : gunplaCoverUrl(file);
    const alt = inFolder
      ? `${kit.title} — ${file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")}`
      : kit.title;
    return {
      alt,
      src,
      onClick: () => openLightbox(src, alt),
    };
  });

  mountGunplaGallery(mount, items);
}

main();
