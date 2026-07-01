import manifest from "virtual:gunpla-manifest";
import { getGunplaLightbox, loadGunplaReview, mountKitGallery } from "./gunpla-kit-content.js";

function getKitSlug() {
  const fromHtml = document.documentElement.dataset.kit;
  if (fromHtml) return fromHtml;
  const match = location.pathname.match(/\/gunpla\/([^/]+)\.html$/i);
  return match ? decodeURIComponent(match[1]) : null;
}

function main() {
  const slug = getKitSlug();
  const kit = manifest.find((k) => k.slug === slug);
  const reviewMount = document.getElementById("gunpla-kit-review");
  const galleryMount = document.getElementById("gunpla-kit-gallery");
  if (!galleryMount || !kit) return;

  loadGunplaReview(slug, reviewMount);

  const { openLightbox } = getGunplaLightbox();
  mountKitGallery(galleryMount, kit, openLightbox);
}

main();
