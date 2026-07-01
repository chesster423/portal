import manifest from "virtual:gunpla-manifest";
import { getGunplaLightbox, loadGunplaReview, mountKitGallery } from "./gunpla-kit-content.js";
import { playBackButtonSound, playPopupSound } from "./ui-sounds.js";

const MODAL_TRANSITION_MS = 400;

export function initGunplaModal() {
  const root = document.getElementById("gunpla-modal");
  const backdrop = document.getElementById("gunpla-modal-backdrop");
  const closeBtn = document.getElementById("gunpla-modal-close");
  const titleEl = document.getElementById("gunpla-modal-title");
  const reviewEl = document.getElementById("gunpla-modal-review");
  const galleryEl = document.getElementById("gunpla-modal-gallery");

  if (!root || !titleEl || !galleryEl) {
    return { open: () => {}, close: () => {} };
  }

  const { openLightbox } = getGunplaLightbox();
  let isOpen = false;
  let closeTimer = null;

  function finishClose() {
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    titleEl.textContent = "";
    if (reviewEl) {
      reviewEl.hidden = true;
      reviewEl.innerHTML = "";
    }
    galleryEl.innerHTML = "";
    document.documentElement.classList.remove("gunpla-modal-open");
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    playBackButtonSound();
    root.classList.remove("is-open");
    document.documentElement.classList.remove("gunpla-modal-open");
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(finishClose, MODAL_TRANSITION_MS);
  }

  async function open(slug) {
    const kitSlug = String(slug ?? "").trim();
    if (!kitSlug) return;

    const kit = manifest.find((k) => k.slug === kitSlug);
    if (!kit) return;

    window.clearTimeout(closeTimer);

    titleEl.textContent = kit.title;
    if (reviewEl) {
      reviewEl.hidden = true;
      reviewEl.innerHTML = "";
    }
    galleryEl.innerHTML = "";

    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("gunpla-modal-open");
    requestAnimationFrame(() => {
      root.classList.add("is-open");
    });

    isOpen = true;
    playPopupSound();
    closeBtn?.focus();

    await loadGunplaReview(kitSlug, reviewEl);
    mountKitGallery(galleryEl, kit, openLightbox);
  }

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !isOpen) return;
    const lightbox = document.getElementById("gunpla-lightbox");
    if (lightbox && !lightbox.hidden) return;
    close();
  });

  return { open, close };
}
