import manifest from "virtual:gunpla-manifest";
import {
  gunplaCoverUrl,
  kitDetailHref,
  mountGunplaGallery,
} from "./gunpla-shared.js";

function main() {
  const mount = document.getElementById("gunpla-gallery");
  if (!mount) return;

  const published = manifest.filter((kit) => kit.hasReview);

  const items = published.map((kit) => ({
    alt: kit.title,
    src: gunplaCoverUrl(kit.cover),
    href: kitDetailHref(kit.slug),
  }));

  mountGunplaGallery(mount, items, {
    onItemClick: (item) => item.href,
  });
}

main();
