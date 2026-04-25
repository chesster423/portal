export const REVIEWS_STORAGE_KEY = "chesster-reviews-v1";
export const DASH_SESSION_KEY = "chesster-dashboard-session";

export function readStoredReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export function writeStoredReviews(reviews) {
  localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

export function clearStoredReviews() {
  localStorage.removeItem(REVIEWS_STORAGE_KEY);
}
