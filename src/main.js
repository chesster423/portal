import "./style.css";
import { readStoredReviews } from "./storage.js";
import { fetchReviewsFromGoogleSheet } from "./sheets.js";

const base = import.meta.env.BASE_URL;

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h) % 360;
}

function posterStyle(id) {
  const h1 = hashHue(id);
  const h2 = (h1 + 42) % 360;
  return `background: linear-gradient(135deg, hsl(${h1}, 70%, 22%) 0%, hsl(${h2}, 65%, 12%) 100%);`;
}

function scoreTier(score) {
  if (score >= 8.5) return "high";
  if (score >= 6.5) return "mid";
  return "low";
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

function uniqueSorted(items, key) {
  return [...new Set(items.map((r) => r[key]).filter(Boolean))].sort();
}

function renderChips(container, values, group, state, onChange) {
  const allId = `all-${group}`;
  const chips = [
    { value: null, label: "All", id: allId },
    ...values.map((v) => ({ value: v, label: v, id: `${group}-${v}`.replace(/\s+/g, "-") })),
  ];

  container.innerHTML = chips
    .map(
      (c) =>
        `<button type="button" class="chip${state[group] === c.value ? " is-active" : ""}" data-group="${group}" data-value="${c.value ?? ""}" id="${c.id}">${c.label}</button>`,
    )
    .join("");

  container.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const g = btn.dataset.group;
      const raw = btn.dataset.value;
      state[g] = raw === "" ? null : raw;
      onChange();
    });
  });
}

function filterReviews(reviews, state) {
  return reviews.filter((r) => {
    if (state.platform && r.platform !== state.platform) return false;
    if (state.genre && r.genre !== state.genre) return false;
    return true;
  });
}

function renderGrid(container, reviews, onOpen) {
  container.innerHTML = reviews
    .map(
      (r) => `
    <article class="review-card" tabindex="0" role="button" data-id="${r.id}" aria-label="Open review: ${escapeAttr(r.title)}">
      <div class="review-card__poster" style="${posterStyle(r.id)}">
        <span>${escapeHtml(r.title)}</span>
      </div>
      <div class="review-card__body">
        <div class="review-card__meta">
          <span>${escapeHtml(r.platform)}</span>
          <span>${escapeHtml(r.genre)}</span>
        </div>
        <h3 class="review-card__title">${escapeHtml(r.title)}</h3>
        <p class="review-card__summary">${escapeHtml(r.summary)}</p>
        <div class="review-card__footer">
          <span class="score-badge" data-tier="${scoreTier(r.score)}">${r.score}</span>
          <button type="button" class="link-cta" data-open="${escapeAttr(r.id)}">Full review</button>
        </div>
      </div>
    </article>`,
    )
    .join("");

  container.querySelectorAll(".review-card").forEach((card) => {
    const id = card.dataset.id;
    const open = () => onOpen(id);
    card.addEventListener("click", (e) => {
      if (e.target.closest(".link-cta")) return;
      open();
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  });

  container.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      onOpen(btn.getAttribute("data-open"));
    });
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

function goToReviewPage(id) {
  if (!id) return;
  window.location.href = `${base}review.html?id=${encodeURIComponent(id)}`;
}

function avgScore(reviews) {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((a, r) => a + Number(r.score), 0);
  return (sum / reviews.length).toFixed(1);
}

function init() {
  document.getElementById("year").textContent = String(new Date().getFullYear());
}

init();

loadReviews()
  .then((reviews) => {
    const state = { platform: null, genre: null };
    const platformEl = document.getElementById("filter-platform");
    const genreEl = document.getElementById("filter-genre");
    const grid = document.getElementById("review-grid");
    const empty = document.getElementById("empty-state");
    const countHint = document.getElementById("review-count");
    const heroStats = document.getElementById("hero-stats");
    function refreshFilters() {
      renderChips(platformEl, uniqueSorted(reviews, "platform"), "platform", state, refresh);
      renderChips(genreEl, uniqueSorted(reviews, "genre"), "genre", state, refresh);
    }

    function refresh() {
      refreshFilters();
      const filtered = filterReviews(reviews, state);
      countHint.textContent = `${filtered.length} game${filtered.length === 1 ? "" : "s"}`;
      empty.hidden = filtered.length > 0;
      grid.hidden = filtered.length === 0;
      renderGrid(grid, filtered, goToReviewPage);
    }

    heroStats.hidden = false;
    heroStats.innerHTML = `
      <span class="stat-pill">${reviews.length} titles</span>
      <span class="stat-pill">Avg ${avgScore(reviews)}</span>
    `;

    refresh();
  })
  .catch(() => {
    const grid = document.getElementById("review-grid");
    grid.innerHTML =
      '<p class="empty-state">Could not load reviews from the Google Sheet or <code>reviews.json</code>. Check the sheet is shared (anyone with the link can view) and column headers match <code>id, title, platform, genre, score, date</code> (or <code>data</code>), <code>summary, body</code>.</p>';
  });
