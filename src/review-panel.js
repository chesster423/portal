import { renderReviewDetail, renderReviewError } from "./review-detail.js";

const PANEL_TRANSITION_MS = 400;

export function initReviewPanel({ base, getReviews }) {
  const root = document.getElementById("review-drawer");
  const backdrop = document.getElementById("review-drawer-backdrop");
  const closeBtn = document.getElementById("review-drawer-close");
  const detailEl = document.getElementById("review-drawer-detail");

  if (!root || !detailEl) {
    return { open: () => {}, close: () => {} };
  }

  let isOpen = false;
  let closeTimer = null;

  function finishClose() {
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    detailEl.innerHTML = "";
    document.documentElement.classList.remove("review-drawer-open");
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.classList.remove("is-open");
    document.documentElement.classList.remove("review-drawer-open");
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(finishClose, PANEL_TRANSITION_MS);
  }

  function open(id) {
    const reviewId = String(id ?? "").trim();
    if (!reviewId) return;

    window.clearTimeout(closeTimer);

    const reviews = getReviews();
    const review = reviews.find((item) => String(item.id).trim() === reviewId);

    if (!review) {
      renderReviewError(detailEl, `Review with id "${reviewId}" was not found.`);
    } else {
      renderReviewDetail(detailEl, review, base);
    }

    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("review-drawer-open");
    requestAnimationFrame(() => {
      root.classList.add("is-open");
    });

    isOpen = true;
    closeBtn?.focus();
  }

  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) close();
  });

  return { open, close };
}
