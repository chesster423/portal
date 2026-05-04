/** Same rules as sheet-derived ids when the id column is empty. */

export function slugFromTitle(title) {
  return String(title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
