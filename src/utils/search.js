/**
 * Ranks how well `text` matches a lowercased `query` (lower is better,
 * Infinity means no match). The last tier lets every query token match the
 * start of some word, so "computer vision" still finds "Computer vision".
 */
export function scoreSuggestionMatch(text, query) {
  const normalized = text.toLowerCase();
  if (normalized.startsWith(query)) return 0;
  const words = normalized.split(/\s+/);
  if (words.some(word => word.startsWith(query))) return 1;
  if (normalized.includes(query)) return 2;
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1 && tokens.every(token => words.some(word => word.startsWith(token)))) return 3;
  return Infinity;
}

/** Ranks `items` against `query` and keeps the best `limit`, using `textOf` to read each item's label. */
export function rankMatches(items, query, limit, textOf) {
  const matches = items
    .map(item => ({ item, score: scoreSuggestionMatch(textOf(item), query) }))
    .filter(match => Number.isFinite(match.score))
    .sort((a, b) => a.score - b.score || textOf(a.item).localeCompare(textOf(b.item)));
  return matches.slice(0, limit).map(match => match.item);
}
