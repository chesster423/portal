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

export function getGradientColorLabel(type, index, count) {
  if (type === "linear") {
    if (count === 2) return index === 0 ? "Start" : "End";
    return String(index + 1);
  }

  if (count === 2) return index === 0 ? "Left" : "Right";
  if (count === 3) {
    if (index === 0) return "Left";
    if (index === 1) return "Right";
    return "Base";
  }
  if (count === 4) {
    return ["Left", "Right", "Blend", "Base"][index] ?? String(index + 1);
  }
  if (count === 5) {
    return ["Left", "Right", "L-blend", "R-blend", "Base"][index] ?? String(index + 1);
  }

  return String(index + 1);
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
          <div class="gunpla-lightbox__bg-head">
            <span class="gunpla-lightbox__bg-label">Background</span>
            <div class="gunpla-lightbox__bg-mode" role="group" aria-label="Background type">
              <button type="button" class="gunpla-lightbox__mode-btn is-active" data-mode="solid" aria-pressed="true">Solid</button>
              <button type="button" class="gunpla-lightbox__mode-btn" data-mode="gradient" aria-pressed="false">Gradient</button>
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
          <div class="gunpla-lightbox__bg-panel gunpla-lightbox__bg-panel--solid">
            <div class="gunpla-lightbox__swatches">${presetButtons}</div>
            <label class="gunpla-lightbox__picker" title="Custom color">
              <span class="gunpla-lightbox__picker-label">Custom</span>
              <input type="color" class="gunpla-lightbox__color-input" value="${DEFAULT_GUNPLA_BG}" aria-label="Custom background color" />
            </label>
          </div>
          <div class="gunpla-lightbox__bg-panel gunpla-lightbox__bg-panel--gradient" hidden>
            <div class="gunpla-lightbox__gradient-bar">
              <div class="gunpla-lightbox__gradient-type" role="group" aria-label="Gradient type">
                <button type="button" class="gunpla-lightbox__type-btn is-active" data-type="linear" aria-pressed="true">Linear</button>
                <button type="button" class="gunpla-lightbox__type-btn" data-type="radial" aria-pressed="false">Radial</button>
              </div>
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
            </div>
            <div class="gunpla-lightbox__gradient-colors" role="group" aria-label="Gradient colors"></div>
          </div>
        </div>
        <div class="gunpla-lightbox__zoom" role="group" aria-label="Image zoom">
          <button type="button" class="gunpla-lightbox__zoom-btn" data-zoom="out" aria-label="Zoom out">−</button>
          <span class="gunpla-lightbox__zoom-value" aria-live="polite">100%</span>
          <button type="button" class="gunpla-lightbox__zoom-btn" data-zoom="in" aria-label="Zoom in">+</button>
          <button
            type="button"
            class="gunpla-lightbox__zoom-btn gunpla-lightbox__zoom-reset"
            data-zoom="reset"
            aria-label="Reset zoom"
            title="Reset zoom"
          >↺</button>
        </div>
        <button type="button" class="gunpla-lightbox__close" aria-label="Close preview">×</button>
      </div>
      <div class="gunpla-lightbox__frame">
        <div class="gunpla-lightbox__canvas">
          <div class="gunpla-lightbox__viewport">
            <img class="gunpla-lightbox__img" src="" alt="" decoding="async" />
          </div>
          <div class="gunpla-lightbox__lens" hidden aria-hidden="true">
            <img class="gunpla-lightbox__lens-img" src="" alt="" decoding="async" tabindex="-1" />
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const canvas = root.querySelector(".gunpla-lightbox__canvas");
  const imgEl = root.querySelector(".gunpla-lightbox__img");
  const lensEl = root.querySelector(".gunpla-lightbox__lens");
  const lensImgEl = root.querySelector(".gunpla-lightbox__lens-img");
  const zoomValueEl = root.querySelector(".gunpla-lightbox__zoom-value");
  const zoomBtns = [...root.querySelectorAll(".gunpla-lightbox__zoom-btn")];
  const closeBtn = root.querySelector(".gunpla-lightbox__close");
  const backdrop = root.querySelector(".gunpla-lightbox__backdrop");
  const swatches = [...root.querySelectorAll(".gunpla-lightbox__swatch")];
  const colorInput = root.querySelector(".gunpla-lightbox__color-input");
  const flipBtn = root.querySelector(".gunpla-lightbox__flip");
  const modeBtns = [...root.querySelectorAll(".gunpla-lightbox__mode-btn")];
  const solidPanel = root.querySelector(".gunpla-lightbox__bg-panel--solid");
  const gradientPanel = root.querySelector(".gunpla-lightbox__bg-panel--gradient");
  const typeBtns = [...root.querySelectorAll(".gunpla-lightbox__type-btn")];
  const gradientColorsEl = root.querySelector(".gunpla-lightbox__gradient-colors");
  const angleInput = root.querySelector(".gunpla-lightbox__angle-input");
  const angleLabel = root.querySelector(".gunpla-lightbox__angle");

  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.25;
  const LOUPE_ZOOM = 2.5;
  const LENS_SIZE = 140;
  const LENS_OFFSET = 24;
  const canLoupe = !window.matchMedia("(pointer: coarse)").matches;

  let lastFocus = null;
  let flipped = false;
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panOriginX = 0;
  let panOriginY = 0;
  let bgMode = "solid";
  let solidColor = DEFAULT_GUNPLA_BG;
  let gradient = {
    type: DEFAULT_GUNPLA_GRADIENT.type,
    angle: DEFAULT_GUNPLA_GRADIENT.angle,
    colors: [...DEFAULT_GUNPLA_GRADIENT.colors],
  };

  function clampZoom(value) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
  }

  function formatZoomLabel(value) {
    return `${Math.round(value * 100)}%`;
  }

  function syncZoomUi() {
    zoomValueEl.textContent = formatZoomLabel(zoom);
    for (const btn of zoomBtns) {
      const action = btn.dataset.zoom;
      if (action === "in") btn.disabled = zoom >= ZOOM_MAX;
      else if (action === "out") btn.disabled = zoom <= ZOOM_MIN;
      else if (action === "reset") btn.disabled = zoom === 1 && panX === 0 && panY === 0;
    }
    canvas.classList.toggle("is-zoomed", zoom > 1);
    canvas.classList.toggle("is-loupe", canLoupe && zoom === 1);
    if (zoom > 1) hideLens();
  }

  function applyImageTransform() {
    const scaleX = (flipped ? -1 : 1) * zoom;
    imgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${scaleX}, ${zoom})`;
  }

  function resetZoom() {
    zoom = 1;
    panX = 0;
    panY = 0;
    applyImageTransform();
    syncZoomUi();
  }

  function setZoom(nextZoom) {
    zoom = clampZoom(nextZoom);
    if (zoom === 1) {
      panX = 0;
      panY = 0;
    }
    applyImageTransform();
    syncZoomUi();
  }

  function adjustZoom(delta) {
    setZoom(clampZoom(Math.round((zoom + delta) / ZOOM_STEP) * ZOOM_STEP));
  }

  function hideLens() {
    lensEl.hidden = true;
  }

  function updateLens(clientX, clientY) {
    if (!canLoupe || zoom !== 1 || isPanning) {
      hideLens();
      return;
    }

    const imgRect = imgEl.getBoundingClientRect();
    if (imgRect.width < 1 || imgRect.height < 1) {
      hideLens();
      return;
    }

    const inside =
      clientX >= imgRect.left &&
      clientX <= imgRect.right &&
      clientY >= imgRect.top &&
      clientY <= imgRect.bottom;

    if (!inside) {
      hideLens();
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const relX = (clientX - imgRect.left) / imgRect.width;
    const relY = (clientY - imgRect.top) / imgRect.height;
    const focusX = flipped ? 1 - relX : relX;
    const lensW = imgRect.width * LOUPE_ZOOM;
    const lensH = imgRect.height * LOUPE_ZOOM;
    const half = LENS_SIZE / 2;

    let left = clientX - canvasRect.left + LENS_OFFSET;
    let top = clientY - canvasRect.top + LENS_OFFSET;

    if (left + LENS_SIZE > canvasRect.width) {
      left = clientX - canvasRect.left - LENS_SIZE - LENS_OFFSET;
    }
    if (top + LENS_SIZE > canvasRect.height) {
      top = clientY - canvasRect.top - LENS_SIZE - LENS_OFFSET;
    }

    lensEl.hidden = false;
    lensEl.style.width = `${LENS_SIZE}px`;
    lensEl.style.height = `${LENS_SIZE}px`;
    lensEl.style.left = `${left}px`;
    lensEl.style.top = `${top}px`;

    lensImgEl.style.width = `${lensW}px`;
    lensImgEl.style.height = `${lensH}px`;
    lensImgEl.style.transform = `translate(${half - focusX * lensW}px, ${half - relY * lensH}px)`;
  }

  function setFlipped(on) {
    flipped = on;
    imgEl.classList.toggle("is-flipped", on);
    flipBtn.classList.toggle("is-active", on);
    flipBtn.setAttribute("aria-pressed", on ? "true" : "false");
    applyImageTransform();
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
    angleInput.value = String(gradient.angle);
    angleLabel.hidden = gradient.type !== "linear";
    angleInput.disabled = gradient.type !== "linear";
    if (rebuildColors) {
      renderGradientColors();
    } else {
      updateGradientColorLabels();
    }
  }

  function updateGradientColorLabels() {
    for (const stop of gradientColorsEl.querySelectorAll(".gunpla-lightbox__gradient-stop")) {
      const index = Number(stop.dataset.index);
      const labelText = getGradientColorLabel(
        gradient.type,
        index,
        gradient.colors.length,
      );
      const label = stop.querySelector(".gunpla-lightbox__gradient-stop-label");
      const input = stop.querySelector(".gunpla-lightbox__gradient-color-input");
      const removeBtn = stop.querySelector(".gunpla-lightbox__gradient-remove");
      if (label) label.textContent = labelText;
      if (input) {
        input.setAttribute("aria-label", `${labelText} gradient color`);
        stop.querySelector(".gunpla-lightbox__gradient-stop-picker")?.setAttribute(
          "title",
          labelText,
        );
      }
      if (removeBtn) {
        removeBtn.setAttribute("aria-label", `Remove ${labelText} color`);
      }
    }
  }

  function renderGradientColors() {
    gradientColorsEl.innerHTML = "";

    gradient.colors.forEach((color, index) => {
      const stop = document.createElement("div");
      stop.className = "gunpla-lightbox__gradient-stop";
      stop.dataset.index = String(index);

      const labelText = document.createElement("span");
      labelText.className = "gunpla-lightbox__gradient-stop-label";
      labelText.textContent = getGradientColorLabel(
        gradient.type,
        index,
        gradient.colors.length,
      );

      const picker = document.createElement("label");
      picker.className = "gunpla-lightbox__gradient-stop-picker";
      picker.title = labelText.textContent;

      const input = document.createElement("input");
      input.type = "color";
      input.className = "gunpla-lightbox__gradient-color-input";
      input.value = color;
      input.setAttribute(
        "aria-label",
        `${labelText.textContent} gradient color`,
      );
      input.addEventListener("input", () => {
        gradient.colors[index] = input.value;
        applyPreviewBg();
      });

      picker.append(input);

      stop.append(labelText, picker);

      if (gradient.colors.length > MIN_GUNPLA_GRADIENT_COLORS) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "gunpla-lightbox__gradient-remove";
        removeBtn.textContent = "×";
        removeBtn.setAttribute("aria-label", `Remove ${labelText.textContent} color`);
        removeBtn.addEventListener("click", () => {
          const next = gradient.colors.filter((_, i) => i !== index);
          updateGradient({ colors: next });
        });
        stop.appendChild(removeBtn);
      }

      gradientColorsEl.appendChild(stop);
    });

    if (gradient.colors.length < MAX_GUNPLA_GRADIENT_COLORS) {
      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "gunpla-lightbox__gradient-add";
      addBtn.textContent = "+";
      addBtn.title = "Add color";
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
    solidPanel.hidden = bgMode !== "solid";
    gradientPanel.hidden = bgMode !== "gradient";
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
    syncGradientUi({ rebuildColors: false });
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
    lensImgEl.src = src;
    lensImgEl.alt = "";
    resetZoom();
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
    lensImgEl.removeAttribute("src");
    hideLens();
    resetZoom();
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

  for (const btn of zoomBtns) {
    btn.addEventListener("click", () => {
      const action = btn.dataset.zoom;
      if (action === "in") adjustZoom(ZOOM_STEP);
      else if (action === "out") adjustZoom(-ZOOM_STEP);
      else if (action === "reset") resetZoom();
    });
  }

  canvas.addEventListener("wheel", (e) => {
    if (root.hidden) return;
    e.preventDefault();
    adjustZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  }, { passive: false });

  canvas.addEventListener("mousemove", (e) => {
    updateLens(e.clientX, e.clientY);
  });

  canvas.addEventListener("mouseleave", hideLens);

  canvas.addEventListener("mousedown", (e) => {
    if (zoom <= 1 || e.button !== 0) return;
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panOriginX = panX;
    panOriginY = panY;
    canvas.classList.add("is-panning");
    hideLens();
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isPanning) return;
    panX = panOriginX + (e.clientX - panStartX);
    panY = panOriginY + (e.clientY - panStartY);
    applyImageTransform();
  });

  window.addEventListener("mouseup", () => {
    if (!isPanning) return;
    isPanning = false;
    canvas.classList.remove("is-panning");
  });

  syncModeUi();
  syncZoomUi();
  applyPreviewBg();

  return { root, openLightbox, closeLightbox };
}

export function mountGunplaGallery(mount, items, options = {}) {
  const { onKitOpen } = options;
  const frag = document.createDocumentFragment();
  for (const item of items) {
    const figure = document.createElement("figure");
    figure.className = "gunpla-gallery__item";

    if (onKitOpen) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gunpla-gallery__trigger";
      btn.setAttribute("aria-label", `View ${item.alt}`);
      const img = document.createElement("img");
      img.className = "gunpla-gallery__img";
      img.src = item.src;
      img.alt = item.alt;
      img.loading = "lazy";
      img.decoding = "async";
      btn.appendChild(img);
      btn.addEventListener("click", () => onKitOpen(item));
      figure.appendChild(btn);
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
