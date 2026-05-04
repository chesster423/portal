import "./style.css";
import { readStoredReviews } from "./storage.js";
import { fetchReviewsFromGoogleSheet } from "./sheets.js";
import { posterCandidateUrls, posterFallbackStyle, wirePosterCandidates } from "./poster.js";

const base = import.meta.env.BASE_URL;

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

async function loadReviews() {
  const stored = readStoredReviews();
  if (stored && stored.length) return stored;
  return fetchReviewsFromGoogleSheet();
}

function renderError(el, message) {
  el.innerHTML = `<p class="empty-state">${message}</p>`;
}

function renderReview(el, review) {
  const urls = posterCandidateUrls(review, base);
  const src0 = urls[0] || "";
  const dataUrls = encodeURIComponent(JSON.stringify(urls));
  const img =
    urls.length > 0
      ? `<img class="review-detail__hero-bg" src="${escapeAttr(src0)}" alt="" decoding="async" loading="eager" data-poster-urls="${escapeAttr(dataUrls)}" />`
      : "";

  el.innerHTML = `
    <header class="review-detail__hero" style="${posterFallbackStyle(review.id)}">
      ${img}
      <h1 class="review-detail__title">${escapeHtml(review.title)}</h1>
    </header>
    <div class="review-detail__body">
      <p class="review-detail__meta">
        <span>${escapeHtml(review.platform)}</span>
        <span>${escapeHtml(review.genre)}</span>
        <span>${escapeHtml(review.date)}</span>
        <span class="score-badge" data-tier="${scoreTier(review.score)}">${review.score}</span>
      </p>
      <p class="review-detail__summary">${escapeHtml(review.summary)}</p>
      <p class="review-detail__text">${escapeHtml(review.body)}</p>
      <p class="review-detail__id">Review ID: <code>${escapeHtml(review.id)}</code></p>
    </div>
  `;

  wirePosterCandidates(el);
}

async function init() {
  const reviewEl = document.getElementById("review-detail");
  const params = new URLSearchParams(window.location.search);
  const id = (params.get("id") || "").trim();

  if (!id) {
    renderError(reviewEl, "No review id was provided. Go back and open a review from the list.");
    return;
  }

  try {
    const reviews = await loadReviews();
    const review = reviews.find((item) => String(item.id).trim() === id);
    if (!review) {
      renderError(reviewEl, `Review with id "${escapeHtml(id)}" was not found in the sheet data.`);
      return;
    }
    renderReview(reviewEl, review);
  } catch {
    renderError(
      reviewEl,
      "Could not load reviews from the Google Sheet. Please try again later.",
    );
  }
}

init();
