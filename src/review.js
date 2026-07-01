import "./style.css";
import { renderReviewDetail, renderReviewError } from "./review-detail.js";
import { loadReviews } from "./main-functions.js";

const base = import.meta.env.BASE_URL;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function init() {
  const reviewEl = document.getElementById("review-detail");
  const params = new URLSearchParams(window.location.search);
  const id = (params.get("id") || "").trim();

  if (!id) {
    renderReviewError(reviewEl, "No review id was provided. Go back and open a review from the list.");
    return;
  }

  try {
    const reviews = await loadReviews();
    const review = reviews.find((item) => String(item.id).trim() === id);
    if (!review) {
      renderReviewError(reviewEl, `Review with id "${escapeHtml(id)}" was not found in the sheet data.`);
      return;
    }
    renderReviewDetail(reviewEl, review, base);
  } catch {
    renderReviewError(
      reviewEl,
      "Could not load reviews from the Google Sheet. Please try again later.",
    );
  }
}

init();
