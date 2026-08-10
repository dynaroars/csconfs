import { DAYS_IN_WEEK, EVENT_TYPES } from './constants';

/**
 * Formats a Date as YYYY-MM-DD from its *local* calendar date.
 *
 * Not toISOString(): that converts to UTC first, so for a viewer at a positive
 * UTC offset a cell built at local midnight reports the previous day and every
 * event lands one square late.
 *
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Normalises a stored date to a YYYY-MM-DD key.
 *
 * Deadlines in the database are calendar dates, not instants, so they are
 * compared as plain strings. Turning them into Date objects would reintroduce
 * a timezone that the source data never had. (The AoE offset that matters for
 * "time remaining" is applied by the countdown, not here.)
 *
 * @param {string | Date | null} value
 * @returns {string | null} YYYY-MM-DD, or null if not a recognisable date
 */
function toDateKey(value) {
    if (!value) return null;
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : formatLocalDate(value);
    }
    const text = String(value);
    return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}

/**
 * Checks if two dates are the same day.
 *
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are the same day
 */
export function isSameDay(date1, date2) {
    return formatLocalDate(date1) === formatLocalDate(date2);
}

/**
 * Gets normalized today's date (time set to 00:00:00).
 *
 * @returns {Date} Today's date at midnight
 */
export function getTodayNormalized() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/**
 * Generates an array of calendar days for the given month, including
 * trailing days from previous month and leading days from next month.
 *
 * @param {Date} currentDate - The date representing the current month
 * @returns {Array<{date: number, isCurrentMonth: boolean, fullDate: Date}>}
 */
export function generateCalendarDays(currentDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add trailing days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        days.push({
            date: prevMonthLastDay - i,
            isCurrentMonth: false,
            fullDate: new Date(year, month - 1, prevMonthLastDay - i)
        });
    }

    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({
            date: i,
            isCurrentMonth: true,
            fullDate: new Date(year, month, i)
        });
    }

    // Add leading days from next month to complete the grid
    const remainingDays = DAYS_IN_WEEK - (days.length % DAYS_IN_WEEK);
    if (remainingDays < DAYS_IN_WEEK) {
        for (let i = 1; i <= remainingDays; i++) {
            days.push({
                date: i,
                isCurrentMonth: false,
                fullDate: new Date(year, month + 1, i)
            });
        }
    }

    return days;
}

/**
 * Extracts conference events falling on a specific day.
 *
 * @param {Array} conferences - Array of conference objects
 * @param {Date} dayDate - The day to collect events for
 * @returns {Array<{name: string, type: string, label: string, color: string, link: string}>}
 */
export function getConferencesForDay(conferences, dayDate) {
    if (!Array.isArray(conferences) || conferences.length === 0) {
        return [];
    }

    const dayKey = formatLocalDate(dayDate);
    const events = [];
    const seen = new Set();

    // Which conference field maps to which kind of marker.
    const FIELDS = [
        ['deadline', EVENT_TYPES.DEADLINE],
        ['abstract_deadline', EVENT_TYPES.ABSTRACT],
        ['notification_date', EVENT_TYPES.NOTIFICATION],
        ['parsed_date', EVENT_TYPES.CONFERENCE],
    ];

    conferences.forEach(conf => {
        for (const [field, eventType] of FIELDS) {
            if (toDateKey(conf[field]) !== dayKey) continue;

            const key = `${conf.name}-${eventType.type}`;
            if (seen.has(key)) continue;
            seen.add(key);

            events.push({
                name: conf.name,
                type: eventType.type,
                label: `${conf.name} ${eventType.label}`,
                color: eventType.color,
                link: conf.link,
            });
        }
    });

    return events;
}
