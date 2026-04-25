import "./style.css";
import { readStoredReviews } from "./storage.js";
import { fetchReviewsFromGoogleSheet } from "./sheets.js";

const base = import.meta.env.BASE_URL;

function scoreTier(score) {
  if (score >= 8.5) return "high";
  if (score >= 6.5) return "mid";
  return "low";
}

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h) % 360;
}

function posterStyle(id) {
  const h1 = hashHue(id || "review");
  const h2 = (h1 + 42) % 360;
  return `background: linear-gradient(135deg, hsl(${h1}, 70%, 30%) 0%, hsl(${h2}, 65%, 18%) 100%);`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadBundledReviews() {
  const res = await fetch(`${base}reviews.json`);
  if (!res.ok) throw new Error("Could not load reviews");
  return res.json();
}

async function loadReviews() {
  const stored = readStoredReviews();
  if (stored && stored.length) return stored;
  try {
    return await fetchReviewsFromGoogleSheet();
  } catch {
    return loadBundledReviews();
  }
}

function renderError(el, message) {
  el.innerHTML = `<p class="empty-state">${message}</p>`;
}

function renderReview(el, review) {
  el.innerHTML = `
    <header class="review-detail__hero" style="${posterStyle(review.id)}">
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
      "Could not load reviews from the Google Sheet or reviews.json. Please try again later.",
    );
  }
}

init();
