import "./dashboard.css";
import { DASH_SESSION_KEY, readStoredReviews, writeStoredReviews } from "./storage.js";
import { fetchReviewsFromGoogleSheet } from "./sheets.js";
import { slugFromTitle } from "./slug.js";

const base = import.meta.env.BASE_URL;

const AUTH_USER = "chesster423";
const AUTH_PASS = "chesster423";

const el = (id) => document.getElementById(id);

async function loadWorkingReviews() {
  const stored = readStoredReviews();
  if (stored && stored.length) return stored;
  return fetchReviewsFromGoogleSheet();
}

function persist(reviews) {
  writeStoredReviews(reviews);
}

function isLoggedIn() {
  return sessionStorage.getItem(DASH_SESSION_KEY) === "1";
}

function setLoggedIn(v) {
  if (v) sessionStorage.setItem(DASH_SESSION_KEY, "1");
  else sessionStorage.removeItem(DASH_SESSION_KEY);
}

function downloadJson(reviews) {
  const blob = new Blob([JSON.stringify(reviews, null, 2) + "\n"], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "reviews.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

let reviewsCache = [];

function renderList(activeId) {
  const list = el("review-list");
  list.innerHTML = reviewsCache
    .slice()
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map(
      (r) => `
      <li>
        <button type="button" class="review-list__item${r.id === activeId ? " is-active" : ""}" data-id="${escapeAttr(r.id)}">
          <span>
            <span class="review-list__title">${escapeHtml(r.title)}</span>
            <span class="review-list__meta">${escapeHtml(r.platform)} · ${escapeHtml(r.score)}</span>
          </span>
          <span class="review-list__score">${escapeHtml(String(r.score))}</span>
        </button>
      </li>`,
    )
    .join("");

  list.querySelectorAll("[data-id]").forEach((btn) => {
    btn.addEventListener("click", () => fillForm(btn.getAttribute("data-id")));
  });
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

function fillForm(id) {
  const r = reviewsCache.find((x) => x.id === id);
  if (!r) return;
  el("form-heading").textContent = "Edit review";
  el("field-original-id").value = r.id;
  el("field-id").value = r.id;
  el("field-title").value = r.title;
  el("field-platform").value = r.platform;
  el("field-genre").value = r.genre;
  el("field-score").value = r.score;
  el("field-date").value = r.date;
  el("field-summary").value = r.summary;
  el("field-body").value = r.body;
  el("btn-delete").hidden = false;
  renderList(r.id);
}

function clearForm() {
  el("form-heading").textContent = "New review";
  el("form-review").reset();
  el("field-original-id").value = "";
  el("btn-delete").hidden = true;
  const today = new Date().toISOString().slice(0, 10);
  el("field-date").value = today;
  el("field-score").value = "8";
  renderList(null);
}

function reviewFromForm() {
  const idRaw = el("field-id").value.trim();
  const title = el("field-title").value.trim();
  let id = idRaw || slugFromTitle(title) || `review-${Date.now()}`;
  id = slugFromTitle(id.replace(/\s+/g, "-")) || id;
  return {
    id,
    title,
    platform: el("field-platform").value.trim(),
    genre: el("field-genre").value.trim(),
    score: Number(el("field-score").value),
    date: el("field-date").value,
    summary: el("field-summary").value.trim(),
    body: el("field-body").value.trim(),
  };
}

function validateReview(r) {
  if (!r.title) return "Title is required.";
  if (!r.platform) return "Platform is required.";
  if (!r.genre) return "Genre is required.";
  if (Number.isNaN(r.score) || r.score < 0 || r.score > 10) return "Score must be between 0 and 10.";
  if (!r.date) return "Date is required.";
  if (!r.summary) return "Summary is required.";
  if (!r.body) return "Full review is required.";
  if (!/^[a-z0-9][a-z0-9-]*$/.test(r.id)) return "ID must be lowercase letters, numbers, and hyphens.";
  return null;
}

function showScreens() {
  const logged = isLoggedIn();
  el("screen-login").hidden = logged;
  el("screen-app").hidden = !logged;
}

async function bootApp() {
  try {
    reviewsCache = await loadWorkingReviews();
  } catch {
    reviewsCache = [];
  }
  clearForm();
  el("field-title").addEventListener("blur", () => {
    if (el("field-original-id").value) return;
    const t = el("field-title").value.trim();
    if (t && !el("field-id").value.trim()) el("field-id").value = slugFromTitle(t);
  });
}

el("form-login").addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const u = String(fd.get("username") || "");
  const p = String(fd.get("password") || "");
  const err = el("login-error");
  if (u === AUTH_USER && p === AUTH_PASS) {
    err.hidden = true;
    setLoggedIn(true);
    showScreens();
    bootApp();
  } else {
    err.textContent = "Invalid username or password.";
    err.hidden = false;
  }
});

el("btn-logout").addEventListener("click", () => {
  setLoggedIn(false);
  showScreens();
});

el("btn-new").addEventListener("click", () => clearForm());

el("btn-download").addEventListener("click", () => downloadJson(reviewsCache));

el("btn-reset").addEventListener("click", async () => {
  if (
    !confirm(
      "Replace local reviews with the latest Google Sheet data? Unsaved local-only changes will be lost unless you downloaded them first.",
    )
  ) {
    return;
  }
  try {
    const fresh = await fetchReviewsFromGoogleSheet();
    reviewsCache = fresh;
    persist(reviewsCache);
    clearForm();
  } catch {
    alert("Could not load reviews from the Google Sheet.");
  }
});

el("form-review").addEventListener("submit", (e) => {
  e.preventDefault();
  const r = reviewFromForm();
  const msg = validateReview(r);
  if (msg) {
    alert(msg);
    return;
  }

  const originalId = el("field-original-id").value.trim();
  if (originalId) {
    const idx = reviewsCache.findIndex((x) => x.id === originalId);
    if (idx === -1) return;
    if (r.id !== originalId && reviewsCache.some((x) => x.id === r.id)) {
      alert("Another review already uses this ID.");
      return;
    }
    reviewsCache[idx] = r;
  } else {
    if (reviewsCache.some((x) => x.id === r.id)) {
      alert("ID already exists. Change the ID or edit the existing review.");
      return;
    }
    reviewsCache.push(r);
  }
  persist(reviewsCache);
  fillForm(r.id);
});

el("btn-delete").addEventListener("click", () => {
  const originalId = el("field-original-id").value.trim();
  if (!originalId) return;
  if (!confirm(`Delete “${originalId}”?`)) return;
  reviewsCache = reviewsCache.filter((x) => x.id !== originalId);
  persist(reviewsCache);
  clearForm();
});

el("btn-cancel").addEventListener("click", () => clearForm());

showScreens();
if (isLoggedIn()) bootApp();
