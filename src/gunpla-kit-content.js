import {
  buildGunplaLightbox,
  gunplaCoverUrl,
  gunplaImageUrl,
  gunplaReviewUrl,
  mountGunplaGallery,
} from "./gunpla-shared.js";

let lightboxInstance = null;

export function getGunplaLightbox() {
  if (!lightboxInstance) {
    lightboxInstance = buildGunplaLightbox();
  }
  return lightboxInstance;
}

export async function loadGunplaReview(slug, mount) {
  if (!mount) return false;

  mount.hidden = true;
  mount.innerHTML = "";

  try {
    const res = await fetch(gunplaReviewUrl(slug));
    if (!res.ok) return false;
    const html = await res.text();
    mount.innerHTML = html.trim();
    mount.hidden = false;
    return true;
  } catch {
    return false;
  }
}

export function buildKitGalleryItems(kit) {
  const galleryFiles =
    kit.images.length > 0
      ? kit.images.map((file) => ({ file, inFolder: true }))
      : [{ file: kit.cover, inFolder: false }];

  return galleryFiles.map(({ file, inFolder }) => {
    const src = inFolder ? gunplaImageUrl(kit.slug, file) : gunplaCoverUrl(file);
    const alt = inFolder
      ? `${kit.title} — ${file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ")}`
      : kit.title;
    return { alt, src };
  });
}

export function mountKitGallery(mount, kit, openLightbox) {
  if (!mount || !kit) return;

  mount.innerHTML = "";
  const items = buildKitGalleryItems(kit).map((item) => ({
    ...item,
    onClick: () => openLightbox(item.src, item.alt),
  }));
  mountGunplaGallery(mount, items);
}
