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

async function loadReviews() {
  const stored = readStoredReviews();
  if (stored && stored.length) return stored;
  return fetchReviewsFromGoogleSheet();
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
  const q = String(state.search ?? "")
    .trim()
    .toLowerCase();
  return reviews.filter((r) => {
    if (state.platform && r.platform !== state.platform) return false;
    if (state.genre && r.genre !== state.genre) return false;
    if (q && !String(r.title).toLowerCase().includes(q)) return false;
    return true;
  });
}

function sortReviews(list, sortBy, sortDir) {
  const dir = sortDir === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    if (sortBy === "score") {
      const sa = Number(a.score);
      const sb = Number(b.score);
      const diff = (Number.isFinite(sa) ? sa : 0) - (Number.isFinite(sb) ? sb : 0);
      if (diff !== 0) return diff * dir;
    } else {
      const cmp = String(a.title).localeCompare(String(b.title), undefined, { sensitivity: "base" });
      if (cmp !== 0) return cmp * dir;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

function renderFixedChips(container, options, currentValue, onPick) {
  container.innerHTML = options
    .map(
      (o) =>
        `<button type="button" class="chip${currentValue === o.value ? " is-active" : ""}" data-value="${escapeAttr(o.value)}">${escapeHtml(o.label)}</button>`,
    )
    .join("");

  container.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      onPick(btn.getAttribute("data-value"));
    });
  });
}

function renderGrid(container, reviews, onOpen) {
  container.innerHTML = reviews
    .map((r) => {
      const urls = posterCandidateUrls(r, base);
      const src0 = urls[0] || "";
      const dataUrls = encodeURIComponent(JSON.stringify(urls));
      const img =
        urls.length > 0
          ? `<img class="review-card__poster-bg" src="${escapeAttr(src0)}" alt="" decoding="async" loading="lazy" data-poster-urls="${escapeAttr(dataUrls)}" />`
          : "";
      return `
    <article class="review-card cursor-pointer" tabindex="0" role="button" data-id="${r.id}" aria-label="Open review: ${escapeAttr(r.title)}">
      <div class="review-card__poster" style="${posterFallbackStyle(r.id)}">
        ${img}
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
    </article>`;
    })
    .join("");

  wirePosterCandidates(container);

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

function reviewDateMs(r) {
  const raw = String(r.date ?? "").trim();
  if (!raw || raw === "—") return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

function topTenByScore(reviews) {
  return [...reviews]
    .sort(
      (a, b) =>
        Number(b.score) - Number(a.score) || String(a.id).localeCompare(String(b.id)),
    )
    .slice(0, 10);
}

function latestFiveReviews(reviews) {
  if (!reviews.length) return [];
  const tagged = reviews.map((r) => ({ r, t: reviewDateMs(r) }));
  if (tagged.some((x) => x.t !== null)) {
    return tagged
      .sort((a, b) => {
        const da = a.t ?? Number.NEGATIVE_INFINITY;
        const db = b.t ?? Number.NEGATIVE_INFINITY;
        return db - da || String(a.r.id).localeCompare(String(b.r.id));
      })
      .slice(0, 5)
      .map((x) => x.r);
  }
  return [...reviews].slice(-5).reverse();
}

function renderSidebars(reviews) {
  const topEl = document.getElementById("side-top-10");
  const latestEl = document.getElementById("side-latest-5");
  if (!topEl || !latestEl) return;

  if (!reviews.length) {
    topEl.innerHTML = `<li class="side-list__empty">No reviews loaded</li>`;
    latestEl.innerHTML = `<li class="side-list__empty">No reviews loaded</li>`;
    return;
  }

  const top10 = topTenByScore(reviews);
  topEl.innerHTML = top10
    .map(
      (r) => `
    <li class="side-list__item">
      <a class="side-list__link" href="${base}review.html?id=${encodeURIComponent(r.id)}">${escapeHtml(r.title)}</a>
      <span class="side-list__score" data-tier="${scoreTier(r.score)}">${escapeHtml(String(r.score))}</span>
    </li>`,
    )
    .join("");

  const latest = latestFiveReviews(reviews);
  latestEl.innerHTML = latest
    .map(
      (r) => `
    <li class="side-list__item side-list__item--latest">
      <a class="side-list__link" href="${base}review.html?id=${encodeURIComponent(r.id)}">${escapeHtml(r.title)}</a>
      <span class="side-list__date">${escapeHtml(String(r.date ?? "—"))}</span>
    </li>`,
    )
    .join("");
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

function initFiltersExpand() {
  const section = document.getElementById("filters-section");
  const toggle = document.getElementById("filters-toggle");
  const extra = document.getElementById("filters-extra");
  const textEl = toggle?.querySelector(".filters__toggle-text");
  if (!section || !toggle || !extra || !textEl) return;

  toggle.addEventListener("click", () => {
    const willOpen = extra.hidden;
    extra.hidden = !willOpen;
    toggle.setAttribute("aria-expanded", String(willOpen));
    textEl.textContent = willOpen ? "Fewer filters" : "More filters";
    section.classList.toggle("is-expanded", willOpen);
  });
}

function init() {
  document.getElementById("year").textContent = String(new Date().getFullYear());
  const bannerUrl = `${String(base).replace(/\/?$/, "/")}images/banner.png`;
  document.documentElement.style.setProperty("--hero-banner-image", `url("${bannerUrl}")`);
  initFiltersExpand();
}

init();

loadReviews()
  .then((reviews) => {
    const state = {
      platform: null,
      genre: null,
      search: "",
      sortBy: "title",
      sortDir: "asc",
    };
    const searchEl = document.getElementById("filter-search");
    const sortByEl = document.getElementById("filter-sort-by");
    const sortDirEl = document.getElementById("filter-sort-dir");
    const platformEl = document.getElementById("filter-platform");
    const genreEl = document.getElementById("filter-genre");
    const grid = document.getElementById("review-grid");
    const empty = document.getElementById("empty-state");
    const countHint = document.getElementById("review-count");
    const heroStats = document.getElementById("hero-stats");

    const sortByOptions = [
      { value: "title", label: "Name" },
      { value: "score", label: "Score" },
    ];
    const sortDirOptions = [
      { value: "asc", label: "Ascending" },
      { value: "desc", label: "Descending" },
    ];

    function refreshFilters() {
      renderFixedChips(sortByEl, sortByOptions, state.sortBy, (v) => {
        state.sortBy = v;
        refresh();
      });
      renderFixedChips(sortDirEl, sortDirOptions, state.sortDir, (v) => {
        state.sortDir = v;
        refresh();
      });
      renderChips(platformEl, uniqueSorted(reviews, "platform"), "platform", state, refresh);
      renderChips(genreEl, uniqueSorted(reviews, "genre"), "genre", state, refresh);
    }

    function refresh() {
      refreshFilters();
      const filtered = filterReviews(reviews, state);
      const visible = sortReviews(filtered, state.sortBy, state.sortDir);
      countHint.textContent = `${visible.length} game${visible.length === 1 ? "" : "s"}`;
      empty.hidden = visible.length > 0;
      grid.hidden = visible.length === 0;
      renderGrid(grid, visible, goToReviewPage);
    }

    searchEl.value = state.search;
    searchEl.addEventListener("input", () => {
      state.search = searchEl.value;
      refresh();
    });

    heroStats.hidden = false;
    heroStats.innerHTML = `
      <span class="stat-pill">${reviews.length} titles</span>
      <span class="stat-pill">Avg ${avgScore(reviews)}</span>
    `;

    renderSidebars(reviews);
    refresh();
  })
  .catch(() => {
    renderSidebars([]);
    const grid = document.getElementById("review-grid");
    grid.innerHTML =
      '<p class="empty-state">Could not load reviews from the Google Sheet. Check the sheet is shared (anyone with the link can view) and column headers match <code>id, title, platform, genre, score, date</code> (or <code>data</code>), <code>summary, body</code>.</p>';
  });
