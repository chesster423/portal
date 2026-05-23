import "./style.css";

/** Placeholder gallery — swap for dedicated gold assets when ready. */
const IMAGE_FILES = [
  "banner.png",
  "chrono-trigger.jpg",
  "dragon-quest-11.jpg",
  "dragon-quest-heroes-2.jpg",
  "dragon-quest-heroes.jpg",
  "dynasty-warriors-5-empires.jpg",
  "dynasty-warriors-5xl.jpg",
  "ff-sop-origin.jpg",
  "ff12.jpg",
  "ff15.jpg",
  "ff7-remake.jpg",
  "ffx-2.jpg",
  "ffx.jpg",
  "fire-emblem-genealogy-of-the-holy-war.jpg",
  "gundam-journey-to-jaburo.jpg",
  "gundam-seed-never-ending-tomorrow.jpg",
  "hollow-knight.jpg",
  "mh-rise-sunbreak.jpg",
  "mh-wilds.jpg",
  "mh-word-iceborne.jpg",
  "naruto-un-2.jpg",
  "naruto-un-5.jpg",
  "naruto-uns4.jpg",
  "nioh-2.jpg",
  "nioh.jpg",
  "nnk.jpg",
  "nnk2.jpg",
  "octopath-traveler.jpg",
  "onimusha-2.jpg",
  "persona-4-golden.jpg",
  "persona-5-royal.jpg",
  "persona-5.jpg",
  "samurai-warriors-2-empires.jpg",
  "samurai-warriors-2.jpg",
  "samurai-warriors-4-empires.jpg",
  "samurai-warriors-4.jpg",
  "suikoden-5.jpg",
  "suikoden-tactics.jpg",
  "tales-of-arise.jpg",
  "tekken-5.jpg",
  "tekken-7.jpg",
  "tlou-remastered.jpg",
  "warriors-abyss.jpg",
  "yakuza-like-a-dragon.jpg",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function altFromFilename(name) {
  return name
    .replace(/\.(jpe?g|png|webp|gif)$/i, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function imageUrl(name) {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}images/games/${name}`;
}

function buildLightbox() {
  const root = document.createElement("div");
  root.className = "gold-lightbox";
  root.id = "gold-lightbox";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Enlarged image");
  root.innerHTML = `
    <div class="gold-lightbox__backdrop" data-close="1" tabindex="-1"></div>
    <div class="gold-lightbox__frame">
      <button type="button" class="gold-lightbox__close" aria-label="Close preview">×</button>
      <img class="gold-lightbox__img" src="" alt="" decoding="async" />
    </div>
  `;
  document.body.appendChild(root);
  return root;
}

function main() {
  const mount = document.getElementById("gold-gallery");
  if (!mount) return;

  const lightbox = buildLightbox();
  const imgEl = lightbox.querySelector(".gold-lightbox__img");
  const closeBtn = lightbox.querySelector(".gold-lightbox__close");
  const backdrop = lightbox.querySelector(".gold-lightbox__backdrop");

  let lastFocus = null;

  function openLightbox(src, alt) {
    lastFocus = document.activeElement;
    imgEl.src = src;
    imgEl.alt = alt;
    lightbox.hidden = false;
    document.documentElement.classList.add("gold-lightbox-open");
    closeBtn.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    document.documentElement.classList.remove("gold-lightbox-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
  });

  const frag = document.createDocumentFragment();
  for (const file of shuffle(IMAGE_FILES)) {
    const alt = altFromFilename(file);
    const src = imageUrl(file);
    const figure = document.createElement("figure");
    figure.className = "gold-gallery__item";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gold-gallery__trigger";
    btn.setAttribute("aria-label", `Enlarge: ${alt}`);
    const img = document.createElement("img");
    img.className = "gold-gallery__img";
    img.src = src;
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    btn.appendChild(img);
    btn.addEventListener("click", () => openLightbox(src, alt));
    figure.appendChild(btn);
    frag.appendChild(figure);
  }
  mount.appendChild(frag);
}

main();
