import { slugFromTitle } from "./slug.js";

/** Spreadsheet ID from the shared Google Sheet URL. */
export const REVIEWS_SHEET_ID = "1GJdkyR6EELY7qHzVMQT6H3LREY3CQ1f8IpOiaOLYaKU";

/** First tab; change gid if your data lives on another tab. */
const DEFAULT_GID = "0";

export function sheetCsvUrl(sheetId = REVIEWS_SHEET_ID, gid = DEFAULT_GID) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * RFC-style CSV parse (quoted fields, commas, newlines in quotes).
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const next = s[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !inQuotes) {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      if (row.some((cell) => String(cell).trim().length)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((cell) => String(cell).trim().length)) rows.push(row);
  return rows;
}

function normHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase();
}

/**
 * @param {string[][]} rows
 * @returns {Array<{ id: string, title: string, platform: string, genre: string, score: number, date: string, summary: string, body: string }>}
 */
export function rowsToReviews(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(normHeader);
  const idx = (name) => {
    const aliases = name === "date" ? ["date", "data"] : [name];
    for (const a of aliases) {
      const i = header.indexOf(a);
      if (i !== -1) return i;
    }
    return -1;
  };

  const iId = idx("id");
  const iTitle = idx("title");
  const iPlatform = idx("platform");
  const iGenre = idx("genre");
  const iScore = idx("score");
  const iDate = idx("date");
  const iSummary = idx("summary");
  const iBody = idx("body");

  if (iTitle === -1 || iSummary === -1 || iBody === -1) {
    throw new Error("Sheet must include columns: title, summary, body (and id, platform, genre, score, date or data).");
  }

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const title = String(cells[iTitle] ?? "").trim();
    if (!title) continue;

    const idRaw = iId !== -1 ? String(cells[iId] ?? "").trim() : "";
    const id = idRaw || slugFromTitle(title) || `row-${r}`;

    const platform = iPlatform !== -1 ? String(cells[iPlatform] ?? "").trim() : "";
    const genre = iGenre !== -1 ? String(cells[iGenre] ?? "").trim() : "";
    const scoreRaw = iScore !== -1 ? String(cells[iScore] ?? "").trim() : "0";
    const score = Number.parseFloat(scoreRaw);
    const date = iDate !== -1 ? String(cells[iDate] ?? "").trim() : "";
    const summary = String(cells[iSummary] ?? "").trim();
    const body = String(cells[iBody] ?? "").trim();

    if (!summary || !body) continue;

    out.push({
      id,
      title,
      platform: platform || "—",
      genre: genre || "—",
      score: Number.isFinite(score) ? score : 0,
      date: date || "—",
      summary,
      body,
    });
  }
  return out;
}

export async function fetchReviewsFromGoogleSheet(url = sheetCsvUrl()) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheet HTTP ${res.status}`);
  const text = await res.text();
  const rows = parseCsv(text);
  return rowsToReviews(rows);
}
