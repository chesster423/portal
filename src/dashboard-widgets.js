function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatHours(hours) {
  if (hours >= 100) return `${Math.round(hours)}h`;
  if (hours >= 10) return `${hours.toFixed(0)}h`;
  return `${hours.toFixed(1)}h`;
}

export function renderPlaytimeChart(container, reviews, maxBars = 8) {
  if (!container) return;

  const ranked = reviews
    .filter((r) => Number(r.playtime) > 0)
    .sort((a, b) => Number(b.playtime) - Number(a.playtime))
    .slice(0, maxBars);

  if (!ranked.length) {
    container.innerHTML = `<p class="ps5-widget__empty">Add a <code>playtime</code> column to the sheet to see hours here.</p>`;
    return;
  }

  const max = ranked[0].playtime;
  container.innerHTML = ranked
    .map((r) => {
      const pct = Math.max(8, Math.round((r.playtime / max) * 100));
      return `
        <div class="ps5-playtime__row">
          <span class="ps5-playtime__label" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</span>
          <div class="ps5-playtime__track" aria-hidden="true">
            <span class="ps5-playtime__bar" style="width:${pct}%"></span>
          </div>
          <span class="ps5-playtime__value">${formatHours(r.playtime)}</span>
        </div>`;
    })
    .join("");
}

export function initDashboardWidgets(reviews) {
  renderPlaytimeChart(document.getElementById("dashboard-playtime"), reviews);
}
