import { posterCandidateUrls, posterFallbackStyle, wirePosterCandidates } from "./poster.js";

function scoreTier(score) {
  if (score >= 8.5) return "high";
  if (score >= 6.5) return "mid";
  return "low";
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, "&#39;");
}

function wireReviewViewToggle(container, polished, raw) {
  const textEl = container.querySelector(".review-detail__text");
  const buttons = container.querySelectorAll(".review-view-toggle__btn");
  if (!textEl || !buttons.length) return;

  const views = { polished, raw };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (!view || btn.classList.contains("is-active")) return;

      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-pressed", String(active));
      });

      textEl.textContent = views[view] ?? "";
    });
  });
}

export function renderReviewError(el, message) {
  el.innerHTML = `<p class="empty-state">${message}</p>`;
}

export function renderReviewDetail(el, review, base) {
  const urls = posterCandidateUrls(review, base);
  const src0 = urls[0] || "";
  const dataUrls = encodeURIComponent(JSON.stringify(urls));
  const img =
    urls.length > 0
      ? `<img class="review-detail__hero-bg" src="${escapeAttr(src0)}" alt="" decoding="async" loading="eager" data-poster-urls="${escapeAttr(dataUrls)}" />`
      : "";

  const polished = String(review.polished_review ?? "").trim();
  const raw = String(review.body ?? "").trim();
  const primary = polished || raw;
  const showToggle = Boolean(polished && raw);

  const toggleMarkup = showToggle
    ? `<div class="review-view-toggle" role="group" aria-label="Review format">
        <button type="button" class="review-view-toggle__btn is-active" data-view="polished" aria-pressed="true">Review</button>
        <button type="button" class="review-view-toggle__btn" data-view="raw" aria-pressed="false">Raw notes</button>
      </div>`
    : "";

  el.innerHTML = `
    <header class="review-detail__hero" style="${posterFallbackStyle(review.id)}">
      ${img}
      <h1 class="review-detail__title" id="review-drawer-title">${escapeHtml(review.title)}</h1>
    </header>
    <div class="review-detail__body">
      <p class="review-detail__meta">
        <span>${escapeHtml(review.platform)}</span>
        <span>${escapeHtml(review.genre)}</span>
        <span>${escapeHtml(review.date)}</span>
        <span class="score-badge" data-tier="${scoreTier(review.score)}">${review.score}</span>
      </p>
      <p class="review-detail__summary">${escapeHtml(review.summary)}</p>
      ${toggleMarkup}
      <p class="review-detail__text">${escapeHtml(primary)}</p>
      <p class="review-detail__id">Review ID: <code>${escapeHtml(review.id)}</code></p>
    </div>
  `;

  if (showToggle) wireReviewViewToggle(el, polished, raw);
  wirePosterCandidates(el);
}
