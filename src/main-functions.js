import { readStoredReviews } from "./storage.js";
import { fetchReviewsFromGoogleSheet } from "./sheets.js";
import { posterCandidateUrls, posterFallbackStyle, wirePosterCandidates } from "./poster.js";

export const REVIEW_PAGE_SIZE = 15;

function scoreTier(score) {
  if (score >= 8.5) return "high";
  if (score >= 6.5) return "mid";
  return "low";
}

export async function loadReviews() {
  const stored = readStoredReviews();
  if (stored && stored.length) return stored;
  return fetchReviewsFromGoogleSheet();
}

export function uniqueSorted(items, key) {
  return [...new Set(items.map((r) => r[key]).filter(Boolean))].sort();
}

export function renderChips(container, values, group, state, onChange) {
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

export function filterReviews(reviews, state) {
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

export function sortReviews(list, sortBy, sortDir) {
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

export function renderFixedChips(container, options, currentValue, onPick) {
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

export function renderGrid(container, reviews, onOpen, base) {
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

export function renderSidebars(reviews, base) {
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

export function goToReviewPage(id, base) {
  if (!id) return;
  window.location.href = `${base}review.html?id=${encodeURIComponent(id)}`;
}

export function avgScore(reviews) {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((a, r) => a + Number(r.score), 0);
  return (sum / reviews.length).toFixed(1);
}

export function initFiltersExpand() {
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

export function init(base) {
  document.getElementById("year").textContent = String(new Date().getFullYear());
  const bannerUrl = `${String(base).replace(/\/?$/, "/")}images/banner.png`;
  document.documentElement.style.setProperty("--hero-banner-image", `url("${bannerUrl}")`);
  initFiltersExpand();
}
