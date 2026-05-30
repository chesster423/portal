import "./style.css";

export const GUNPLA_BG_PRESETS = [
  { id: "black", label: "Black", value: "#000000" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "sky", label: "Sky", value: "#93c1ff" },
  { id: "coral", label: "Coral", value: "#ffa9a9" },
  { id: "pink", label: "Pink", value: "#ffa9e8" },
];

export const DEFAULT_GUNPLA_BG = GUNPLA_BG_PRESETS[0].value;

export const MIN_GUNPLA_GRADIENT_COLORS = 2;
export const MAX_GUNPLA_GRADIENT_COLORS = 5;

export const DEFAULT_GUNPLA_GRADIENT = {
  type: "linear",
  angle: 180,
  colors: ["#d12e67", "#4b3075", "#050505"],
};

export function formatGunplaGradientStops(colors) {
  if (colors.length <= 2) {
    return colors.join(", ");
  }
  return colors
    .map((color, index) => `${color} ${(index / (colors.length - 1)) * 100}%`)
    .join(", ");
}

export function buildDualRadialCss(colors) {
  const base = colors.length >= 3 ? colors[colors.length - 1] : "#000000";
  const leftCore = colors[0];
  const rightCore = colors[1] ?? colors[0];
  const leftMid = colors.length >= 4 ? colors[2] : null;
  const rightMid = colors.length >= 5 ? colors[3] : null;

  const leftGradient = leftMid
    ? `radial-gradient(ellipse 95% 85% at 32% 42%, ${leftCore} 0%, ${leftMid} 44%, transparent 72%)`
    : `radial-gradient(ellipse 95% 85% at 32% 42%, ${leftCore} 0%, transparent 68%)`;

  const rightGradient = rightMid
    ? `radial-gradient(ellipse 95% 85% at 68% 58%, ${rightCore} 0%, ${rightMid} 44%, transparent 72%)`
    : `radial-gradient(ellipse 95% 85% at 68% 58%, ${rightCore} 0%, transparent 68%)`;

  return `${leftGradient}, ${rightGradient}, ${base}`;
}

export function buildGunplaGradientCss({ type, angle, colors }) {
  const stops = colors
    .filter(Boolean)
    .slice(0, MAX_GUNPLA_GRADIENT_COLORS);
  while (stops.length < MIN_GUNPLA_GRADIENT_COLORS) {
    stops.push("#333333");
  }

  if (type === "radial") {
    return buildDualRadialCss(stops);
  }

  const deg = Number(angle) || 0;
  return `linear-gradient(${deg}deg, ${formatGunplaGradientStops(stops)})`;
}

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
          <label class="gunpla-lightbox__picker gunpla-lightbox__solid-only" title="Custom color">
            <span class="gunpla-lightbox__picker-label">Custom</span>
            <input type="color" class="gunpla-lightbox__color-input" value="${DEFAULT_GUNPLA_BG}" aria-label="Custom background color" />
          </label>
          <div class="gunpla-lightbox__bg-mode" role="group" aria-label="Background type">
            <button type="button" class="gunpla-lightbox__mode-btn is-active" data-mode="solid" aria-pressed="true">Solid</button>
            <button type="button" class="gunpla-lightbox__mode-btn" data-mode="gradient" aria-pressed="false">Gradient</button>
          </div>
          <div class="gunpla-lightbox__gradient" hidden>
            <div class="gunpla-lightbox__gradient-type" role="group" aria-label="Gradient type">
              <button type="button" class="gunpla-lightbox__type-btn is-active" data-type="linear" aria-pressed="true">Linear</button>
              <button type="button" class="gunpla-lightbox__type-btn" data-type="radial" aria-pressed="false">Radial</button>
            </div>
            <div class="gunpla-lightbox__gradient-colors" role="group" aria-label="Gradient colors"></div>
            <label class="gunpla-lightbox__angle">
              <span class="gunpla-lightbox__picker-label">Angle</span>
              <input
                type="number"
                class="gunpla-lightbox__angle-input"
                min="0"
                max="360"
                step="1"
                value="${DEFAULT_GUNPLA_GRADIENT.angle}"
                aria-label="Linear gradient angle in degrees"
              />
              <span class="gunpla-lightbox__angle-unit" aria-hidden="true">°</span>
            </label>
            <p class="gunpla-lightbox__gradient-hint gunpla-lightbox__gradient-hint--radial" hidden>
              Dual radial glows overlap in the center. Use 3+ colors: last color is the base.
            </p>
          </div>
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
  const modeBtns = [...root.querySelectorAll(".gunpla-lightbox__mode-btn")];
  const gradientPanel = root.querySelector(".gunpla-lightbox__gradient");
  const typeBtns = [...root.querySelectorAll(".gunpla-lightbox__type-btn")];
  const gradientColorsEl = root.querySelector(".gunpla-lightbox__gradient-colors");
  const angleInput = root.querySelector(".gunpla-lightbox__angle-input");
  const angleLabel = root.querySelector(".gunpla-lightbox__angle");
  const radialHint = root.querySelector(".gunpla-lightbox__gradient-hint--radial");

  let lastFocus = null;
  let flipped = false;
  let bgMode = "solid";
  let solidColor = DEFAULT_GUNPLA_BG;
  let gradient = {
    type: DEFAULT_GUNPLA_GRADIENT.type,
    angle: DEFAULT_GUNPLA_GRADIENT.angle,
    colors: [...DEFAULT_GUNPLA_GRADIENT.colors],
  };

  function setFlipped(on) {
    flipped = on;
    imgEl.classList.toggle("is-flipped", on);
    flipBtn.classList.toggle("is-active", on);
    flipBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  function applyPreviewBg() {
    const value =
      bgMode === "gradient"
        ? buildGunplaGradientCss(gradient)
        : solidColor;
    canvas.style.setProperty("--gunpla-preview-bg", value);
  }

  function syncSolidUi() {
    const isPreset = GUNPLA_BG_PRESETS.some(
      (p) => p.value.toLowerCase() === solidColor.toLowerCase(),
    );
    for (const btn of swatches) {
      const active = btn.dataset.bg?.toLowerCase() === solidColor.toLowerCase();
      btn.classList.toggle("is-active", bgMode === "solid" && active);
      btn.setAttribute("aria-pressed", bgMode === "solid" && active ? "true" : "false");
    }
    colorInput.classList.toggle("is-active", bgMode === "solid" && !isPreset);
    if (!isPreset) colorInput.value = solidColor;
  }

  function syncGradientUi({ rebuildColors = false } = {}) {
    for (const btn of typeBtns) {
      const active = btn.dataset.type === gradient.type;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
    if (rebuildColors) renderGradientColors();
    angleInput.value = String(gradient.angle);
    angleLabel.hidden = gradient.type !== "linear";
    angleInput.disabled = gradient.type !== "linear";
    radialHint.hidden = gradient.type !== "radial";
  }

  function renderGradientColors() {
    gradientColorsEl.innerHTML = "";

    gradient.colors.forEach((color, index) => {
      const row = document.createElement("div");
      row.className = "gunpla-lightbox__gradient-color";

      const label = document.createElement("label");
      label.className = "gunpla-lightbox__picker";
      label.title = `Gradient color ${index + 1}`;

      const labelText = document.createElement("span");
      labelText.className = "gunpla-lightbox__picker-label";
      labelText.textContent = String(index + 1);

      const input = document.createElement("input");
      input.type = "color";
      input.className = "gunpla-lightbox__gradient-color-input";
      input.value = color;
      input.setAttribute("aria-label", `Gradient color ${index + 1}`);
      input.addEventListener("input", () => {
        gradient.colors[index] = input.value;
        applyPreviewBg();
      });

      label.append(labelText, input);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "gunpla-lightbox__gradient-remove";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", `Remove color ${index + 1}`);
      removeBtn.disabled = gradient.colors.length <= MIN_GUNPLA_GRADIENT_COLORS;
      removeBtn.addEventListener("click", () => {
        if (gradient.colors.length <= MIN_GUNPLA_GRADIENT_COLORS) return;
        const next = gradient.colors.filter((_, i) => i !== index);
        updateGradient({ colors: next });
      });

      row.append(label, removeBtn);
      gradientColorsEl.appendChild(row);
    });

    if (gradient.colors.length < MAX_GUNPLA_GRADIENT_COLORS) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "gunpla-lightbox__gradient-add";
      addBtn.textContent = "+ Color";
      addBtn.setAttribute(
        "aria-label",
        `Add gradient color (${gradient.colors.length} of ${MAX_GUNPLA_GRADIENT_COLORS})`,
      );
      addBtn.addEventListener("click", () => {
        const next = [...gradient.colors, gradient.colors[gradient.colors.length - 1]];
        updateGradient({ colors: next });
      });
      gradientColorsEl.appendChild(addBtn);
    }
  }

  function syncModeUi() {
    for (const btn of modeBtns) {
      const active = btn.dataset.mode === bgMode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    }
    gradientPanel.hidden = bgMode !== "gradient";
    root.querySelectorAll(".gunpla-lightbox__solid-only").forEach((el) => {
      el.hidden = bgMode !== "solid";
    });
    syncSolidUi();
    syncGradientUi({ rebuildColors: bgMode === "gradient" });
  }

  function setSolidBg(color) {
    bgMode = "solid";
    solidColor = color;
    syncModeUi();
    applyPreviewBg();
  }

  function setBgMode(mode) {
    bgMode = mode;
    syncModeUi();
    applyPreviewBg();
  }

  function setGradientType(type) {
    gradient.type = type;
    syncGradientUi();
    applyPreviewBg();
  }

  function updateGradient(partial) {
    const rebuildColors = Boolean(
      partial.colors && partial.colors.length !== gradient.colors.length,
    );
    gradient = { ...gradient, ...partial };
    syncGradientUi({ rebuildColors });
    applyPreviewBg();
  }

  function openLightbox(src, alt) {
    lastFocus = document.activeElement;
    imgEl.src = src;
    imgEl.alt = alt;
    setFlipped(false);
    bgMode = "solid";
    solidColor = DEFAULT_GUNPLA_BG;
    gradient = {
      type: DEFAULT_GUNPLA_GRADIENT.type,
      angle: DEFAULT_GUNPLA_GRADIENT.angle,
      colors: [...DEFAULT_GUNPLA_GRADIENT.colors],
    };
    syncModeUi();
    applyPreviewBg();
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
    btn.addEventListener("click", () => setSolidBg(btn.dataset.bg));
  }
  colorInput.addEventListener("input", () => setSolidBg(colorInput.value));
  for (const btn of modeBtns) {
    btn.addEventListener("click", () => setBgMode(btn.dataset.mode));
  }
  for (const btn of typeBtns) {
    btn.addEventListener("click", () => setGradientType(btn.dataset.type));
  }
  angleInput.addEventListener("input", () => {
    const angle = Math.min(360, Math.max(0, Number(angleInput.value) || 0));
    updateGradient({ angle });
  });
  flipBtn.addEventListener("click", () => setFlipped(!flipped));

  syncModeUi();
  applyPreviewBg();

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
