/**
 * Anywhere-on-Earth deadline arithmetic.
 *
 * Stored dates are calendar dates, not instants: a deadline of "2026-09-01"
 * means the AoE day that ends at 11:59:59 UTC on 2026-09-02, because AoE is
 * UTC-12. Deriving that with local-time setters made the answer depend on the
 * viewer's clock -- at UTC+12 and beyond every countdown expired a full day
 * early -- so the calendar parts are read as written and the instant is built
 * in UTC.
 */

/**
 * Calendar year/month/day of a stored date, whatever shape it was written in.
 *
 * @param {string | Date | null | undefined} value
 * @returns {[number, number, number] | null} [year, month (1-12), day], or null
 */
function dateParts(value) {
    if (!value) return null;

    if (value instanceof Date) {
        if (isNaN(value.getTime())) return null;
        return [value.getFullYear(), value.getMonth() + 1, value.getDate()];
    }

    const text = String(value);

    // The common case: "2026-09-01", or an ISO timestamp with that prefix. Read
    // the digits rather than parsing, so a "...T00:00:00.000Z" entry does not
    // slide to the previous day for viewers behind UTC.
    const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (iso) return [Number(iso[1]), Number(iso[2]), Number(iso[3])];

    // A handful of entries are written loosely ("10-22-2027", "March 5, 2028").
    const parsed = new Date(text);
    if (isNaN(parsed.getTime())) return null;
    return [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()];
}

/**
 * The instant an AoE deadline expires: 11:59:59.999 UTC the following day.
 *
 * @param {string | Date | null | undefined} value
 * @returns {Date | null} null when the value is missing or unparseable
 */
export function aoeDeadline(value) {
    const parts = dateParts(value);
    if (!parts) return null;

    const [year, month, day] = parts;
    // Date.UTC normalises the day overflow, so month ends need no special case.
    return new Date(Date.UTC(year, month - 1, day + 1, 11, 59, 59, 999));
}

/**
 * Milliseconds until an AoE deadline expires; negative once it has passed.
 *
 * @param {string | Date | null | undefined} value
 * @param {number} [now] epoch ms to measure from, for testing
 * @returns {number | null} null when the value is missing or unparseable
 */
export function aoeTimeLeft(value, now = Date.now()) {
    const deadline = aoeDeadline(value);
    return deadline === null ? null : deadline.getTime() - now;
}
