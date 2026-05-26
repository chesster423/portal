import "./style.css";

export const GUNPLA_BG_PRESETS = [
  { id: "black", label: "Black", value: "#000000" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "sky", label: "Sky", value: "#93c1ff" },
  { id: "coral", label: "Coral", value: "#ffa9a9" },
  { id: "pink", label: "Pink", value: "#ffa9e8" },
];

export const DEFAULT_GUNPLA_BG = GUNPLA_BG_PRESETS[0].value;

export function gunplaBaseUrl() {
  return `${String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}images/gunpla/`;
}

export function gunplaCoverUrl(cover) {
  return `${gunplaBaseUrl()}${cover}`;
}

export function gunplaImageUrl(slug, file) {
  return `${gunplaBaseUrl()}${slug}/${file}`;
}

export function kitDetailHref(slug) {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}gunpla/${slug}.html`;
}

export function gunplaReviewUrl(slug) {
  const base = String(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}gunpla-reviews/${slug}.html`;
}

export function buildGunplaLightbox() {
  const presetButtons = GUNPLA_BG_PRESETS.map(
    (p) =>
      `<button type="button" class="gunpla-lightbox__swatch" data-bg="${p.value}" aria-label="${p.label} background" title="${p.label}" style="--swatch:${p.value}"></button>`,
  ).join("");

  const root = document.createElement("div");
  root.className = "gunpla-lightbox";
  root.id = "gunpla-lightbox";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Enlarged build photo");
  root.innerHTML = `
    <div class="gunpla-lightbox__backdrop" data-close="1" tabindex="-1"></div>
    <div class="gunpla-lightbox__panel">
      <div class="gunpla-lightbox__toolbar">
        <div class="gunpla-lightbox__bg" role="group" aria-label="Preview background">
          <span class="gunpla-lightbox__bg-label">Background</span>
          <div class="gunpla-lightbox__swatches">${presetButtons}</div>
          <label class="gunpla-lightbox__picker" title="Custom color">
            <span class="gunpla-lightbox__picker-label">Custom</span>
            <input type="color" class="gunpla-lightbox__color-input" value="${DEFAULT_GUNPLA_BG}" aria-label="Custom background color" />
          </label>
          <button
            type="button"
            class="gunpla-lightbox__flip"
            aria-pressed="false"
            aria-label="Flip image horizontally"
            title="Flip horizontally"
          >
            <span class="gunpla-lightbox__flip-icon" aria-hidden="true">⇋</span>
            <span class="gunpla-lightbox__flip-label">Flip</span>
          </button>
        </div>
        <button type="button" class="gunpla-lightbox__close" aria-label="Close preview">×</button>
      </div>
      <div class="gunpla-lightbox__frame">
        <div class="gunpla-lightbox__canvas">
          <img class="gunpla-lightbox__img" src="" alt="" decoding="async" />
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const canvas = root.querySelector(".gunpla-lightbox__canvas");
  const imgEl = root.querySelector(".gunpla-lightbox__img");
  const closeBtn = root.querySelector(".gunpla-lightbox__close");
  const backdrop = root.querySelector(".gunpla-lightbox__backdrop");
  const swatches = [...root.querySelectorAll(".gunpla-lightbox__swatch")];
  const colorInput = root.querySelector(".gunpla-lightbox__color-input");
  const flipBtn = root.querySelector(".gunpla-lightbox__flip");

  let lastFocus = null;
  let flipped = false;

  function setFlipped(on) {
    flipped = on;
    imgEl.classList.toggle("is-flipped", on);
    flipBtn.classList.toggle("is-active", on);
    flipBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function setPreviewBg(color) {
    canvas.style.setProperty("--gunpla-preview-bg", color);
    const isPreset = GUNPLA_BG_PRESETS.some((p) => p.value.toLowerCase() === color.toLowerCase());
    for (const btn of swatches) {
      const active = btn.dataset.bg?.toLowerCase() === color.toLowerCase();
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
    colorInput.classList.toggle("is-active", !isPreset);
    if (!isPreset) colorInput.value = color;
  }

  function openLightbox(src, alt) {
    lastFocus = document.activeElement;
    imgEl.src = src;
    imgEl.alt = alt;
    setFlipped(false);
    setPreviewBg(DEFAULT_GUNPLA_BG);
    root.hidden = false;
    document.documentElement.classList.add("gunpla-lightbox-open");
    closeBtn.focus();
  }

  function closeLightbox() {
    root.hidden = true;
    imgEl.removeAttribute("src");
    imgEl.alt = "";
    setFlipped(false);
    document.documentElement.classList.remove("gunpla-lightbox-open");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  closeBtn.addEventListener("click", closeLightbox);
  backdrop.addEventListener("click", closeLightbox);
  root.addEventListener("click", (e) => {
    if (e.target === root) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !root.hidden) closeLightbox();
  });

  for (const btn of swatches) {
    btn.addEventListener("click", () => setPreviewBg(btn.dataset.bg));
  }
  colorInput.addEventListener("input", () => setPreviewBg(colorInput.value));
  flipBtn.addEventListener("click", () => setFlipped(!flipped));

  setPreviewBg(DEFAULT_GUNPLA_BG);

  return { root, openLightbox, closeLightbox };
}

export function mountGunplaGallery(mount, items, options = {}) {
  const { onItemClick } = options;
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const figure = document.createElement("figure");
    figure.className = "gunpla-gallery__item";

    if (onItemClick) {
      const link = document.createElement("a");
      link.className = "gunpla-gallery__trigger";
      link.href = onItemClick(item);
      link.setAttribute("aria-label", `View ${item.alt}`);
      const img = document.createElement("img");
      img.className = "gunpla-gallery__img";
      img.src = item.src;
      img.alt = item.alt;
      img.loading = "lazy";
      img.decoding = "async";
      link.appendChild(img);
      figure.appendChild(link);
    } else {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gunpla-gallery__trigger";
      btn.setAttribute("aria-label", `Enlarge: ${item.alt}`);
      const img = document.createElement("img");
      img.className = "gunpla-gallery__img";
      img.src = item.src;
      img.alt = item.alt;
      img.loading = "lazy";
      img.decoding = "async";
      btn.appendChild(img);
      btn.addEventListener("click", () => item.onClick?.());
      figure.appendChild(btn);
    }

    frag.appendChild(figure);
  }
  mount.appendChild(frag);
}
