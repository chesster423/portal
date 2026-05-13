import "./style.css";
import {
  REVIEW_PAGE_SIZE,
  avgScore,
  filterReviews,
  goToReviewPage,
  init,
  loadReviews,
  renderChips,
  renderFixedChips,
  renderGrid,
  renderSidebars,
  sortReviews,
  uniqueSorted,
} from "./main-functions.js";

const base = import.meta.env.BASE_URL;

init(base);

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
    const loadMoreWrap = document.getElementById("review-load-more-wrap");
    const loadMoreBtn = document.getElementById("review-load-more");
    let reviewVisibleCount = REVIEW_PAGE_SIZE;

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

    function refresh(resetPaging = true) {
      refreshFilters();
      const filtered = filterReviews(reviews, state);
      const visible = sortReviews(filtered, state.sortBy, state.sortDir);
      if (resetPaging) reviewVisibleCount = REVIEW_PAGE_SIZE;
      reviewVisibleCount = Math.min(reviewVisibleCount, visible.length);
      const slice = visible.slice(0, reviewVisibleCount);
      countHint.textContent = `${visible.length} game${visible.length === 1 ? "" : "s"}`;
      empty.hidden = visible.length > 0;
      grid.hidden = visible.length === 0;
      renderGrid(grid, slice, (id) => goToReviewPage(id, base), base);
      if (loadMoreWrap && loadMoreBtn) {
        const hasMore = visible.length > slice.length;
        loadMoreWrap.hidden = visible.length === 0 || !hasMore;
      }
    }

    searchEl.value = state.search;
    searchEl.addEventListener("input", () => {
      state.search = searchEl.value;
      refresh();
    });

    loadMoreBtn?.addEventListener("click", () => {
      reviewVisibleCount += REVIEW_PAGE_SIZE;
      refresh(false);
    });

    heroStats.hidden = false;
    heroStats.innerHTML = `
      <span class="stat-pill">${reviews.length} titles</span>
      <span class="stat-pill">Avg ${avgScore(reviews)}</span>
    `;

    renderSidebars(reviews, base);
    refresh();
  })
  .catch(() => {
    renderSidebars([], base);
    const grid = document.getElementById("review-grid");
    grid.innerHTML =
      '<p class="empty-state">Could not load reviews from the Google Sheet. Check the sheet is shared (anyone with the link can view) and column headers match <code>id, title, platform, genre, score, date</code> (or <code>data</code>), <code>summary, body</code>.</p>';
  });
