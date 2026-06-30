import "./style.css";
import manifest from "virtual:gunpla-manifest";
import { bootstrapPortal } from "./portal-app.js";
import {
  REVIEW_PAGE_SIZE,
  filterReviews,
  goToReviewPage,
  initFiltersExpand,
  loadReviews,
  renderChips,
  renderFixedChips,
  renderGrid,
  renderSidebars,
  sortReviews,
  uniqueSorted,
} from "./main-functions.js";
import { gunplaCoverUrl, kitDetailHref, mountGunplaGallery } from "./gunpla-shared.js";
import { initUiSounds, playNavSelectSound } from "./ui-sounds.js";

const base = import.meta.env.BASE_URL;
const BOOT_MIN_MS = 1800;

initUiSounds(base);

document.documentElement.classList.add("ps5-mode");

let reviewsCache = [];
let gamesReady = false;
let gunplaReady = false;
let portalScope = null;
let bootFinished = false;

function finishBoot() {
  if (bootFinished) return;

  const completeBoot = () => {
    if (bootFinished) return;
    bootFinished = true;

    document.documentElement.classList.remove("is-booting");
    document.documentElement.classList.add("is-ready");
    const bootEl = document.getElementById("ps5-boot");
    if (bootEl) bootEl.setAttribute("aria-hidden", "true");
  };

  const scheduleCompleteBoot = () => {
    const startedAt = window.__portalBootStartedAt ?? performance.now();
    const wait = Math.max(0, BOOT_MIN_MS - (performance.now() - startedAt));
    window.setTimeout(completeBoot, wait);
  };

  if (window.__portalBootStartedAt) {
    scheduleCompleteBoot();
  } else {
    window.addEventListener("portal-boot-started", scheduleCompleteBoot, { once: true });
  }
}

function setActiveNav(id) {
  if (!window.portalVm) return;
  const apply = () => {
    window.portalVm.activeNav = id;
    window.portalVm.hoverNav = null;
  };
  if (portalScope) portalScope.$apply(apply);
  else apply();
}

function initGamesPanel(reviews) {
  if (gamesReady) return;
  gamesReady = true;

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

  if (searchEl) {
    searchEl.value = state.search;
    searchEl.addEventListener("input", () => {
      state.search = searchEl.value;
      refresh();
    });
  }

  loadMoreBtn?.addEventListener("click", () => {
    reviewVisibleCount += REVIEW_PAGE_SIZE;
    refresh(false);
  });

  initFiltersExpand();
  refresh();
}

function initGunplaPanel() {
  if (gunplaReady) return;
  gunplaReady = true;

  const mount = document.getElementById("gunpla-gallery");
  if (!mount) return;

  const published = manifest.filter((kit) => kit.hasReview);
  const items = published.map((kit) => ({
    alt: kit.title,
    src: gunplaCoverUrl(kit.cover),
    href: kitDetailHref(kit.slug),
  }));

  mountGunplaGallery(mount, items, {
    onItemClick: (item) => item.href,
  });
}

function onNavChange(id) {
  if (id === "games") initGamesPanel(reviewsCache);
  if (id === "gunpla") initGunplaPanel();
}

function focusGamesSearch() {
  const searchEl = document.getElementById("filter-search");
  if (!searchEl) return;
  setActiveNav("games");
  onNavChange("games");
  setTimeout(() => {
    searchEl.focus();
    searchEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, 50);
}

function startApp(reviews) {
  reviewsCache = reviews;
  renderSidebars(reviews, base);
  initUiSounds(base);

  const hooks = {
    base,
    onNavChange,
    onSearchFocus: focusGamesSearch,
    playNavSelectSound,
    bindController(vm, $scope) {
      window.portalVm = vm;
      portalScope = $scope;
    },
  };

  bootstrapPortal(window.angular, hooks);
  finishBoot();
}

loadReviews()
  .then((reviews) => startApp(reviews))
  .catch(() => {
    startApp([]);
    const grid = document.getElementById("review-grid");
    if (grid) {
      grid.innerHTML =
        '<p class="empty-state">Could not load reviews from the Google Sheet. Check the sheet is shared (anyone with the link can view) and column headers match <code>id, title, platform, genre, score, date</code> (or <code>data</code>), <code>summary, body</code>.</p>';
    }
  });
