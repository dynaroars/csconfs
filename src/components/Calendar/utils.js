import { DAYS_IN_WEEK, EVENT_TYPES } from './constants';

/**
 * Adjusts a deadline to Anywhere on Earth (AoE) timezone.
 * AoE is UTC-12, so we add 12 hours to account for the timezone difference.
 *
 * @param {string | Date} deadline - The deadline date to adjust
 * @returns {Date | null} The AoE-adjusted date or null if invalid
 */
export function getAoEAdjustedDeadline(deadline) {
    if (!deadline) return null;
    try {
        const dateObject = new Date(deadline);
        if (isNaN(dateObject.getTime())) return null;

        dateObject.setHours(23, 59, 59, 999);
        dateObject.setUTCDate(dateObject.getUTCDate() + 1);
        return dateObject;
    } catch (error) {
        console.error('Error parsing deadline:', error);
        return null;
    }
}

/**
 * Formats a date to ISO date string (YYYY-MM-DD).
 *
 * @param {Date} date - The date to format
 * @returns {string} ISO date string
 */
export function formatDateToISO(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Checks if two dates are the same day.
 *
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are the same day
 */
export function isSameDay(date1, date2) {
    return formatDateToISO(date1) === formatDateToISO(date2);
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
 * Extracts conference events for a specific day.
 *
 * @param {Array} conferences - Array of conference objects
 * @param {Date} dayDate - The date to check for events
 * @returns {Array<{name: string, type: string, label: string, color: string, link: string}>}
 */
export function getConferencesForDay(conferences, dayDate) {
    if (!Array.isArray(conferences) || conferences.length === 0) {
        return [];
    }

    const dayStr = formatDateToISO(dayDate);
    const events = [];

    conferences.forEach(conf => {
        // Check submission deadline
        if (conf.deadline) {
            const deadline = getAoEAdjustedDeadline(conf.deadline);
            if (deadline && formatDateToISO(deadline) === dayStr) {
                events.push({
                    name: conf.name,
                    type: EVENT_TYPES.DEADLINE.type,
                    label: `${conf.name} ${EVENT_TYPES.DEADLINE.label}`,
                    color: EVENT_TYPES.DEADLINE.color,
                    link: conf.link
                });
            }
        }

        // Check abstract deadline
        if (conf.abstract_deadline) {
            const abstractDeadline = getAoEAdjustedDeadline(conf.abstract_deadline);
            if (abstractDeadline && formatDateToISO(abstractDeadline) === dayStr) {
                events.push({
                    name: conf.name,
                    type: EVENT_TYPES.ABSTRACT.type,
                    label: `${conf.name} ${EVENT_TYPES.ABSTRACT.label}`,
                    color: EVENT_TYPES.ABSTRACT.color,
                    link: conf.link
                });
            }
        }

        // Check notification date
        if (conf.notification_date) {
            const notifDate = getAoEAdjustedDeadline(conf.notification_date);
            if (notifDate && formatDateToISO(notifDate) === dayStr) {
                events.push({
                    name: conf.name,
                    type: EVENT_TYPES.NOTIFICATION.type,
                    label: `${conf.name} ${EVENT_TYPES.NOTIFICATION.label}`,
                    color: EVENT_TYPES.NOTIFICATION.color,
                    link: conf.link
                });
            }
        }

        // Check conference date
        if (conf.date) {
            const confDate = new Date(conf.date);
            if (!isNaN(confDate.getTime()) && formatDateToISO(confDate) === dayStr) {
                events.push({
                    name: conf.name,
                    type: EVENT_TYPES.CONFERENCE.type,
                    label: `${conf.name} ${EVENT_TYPES.CONFERENCE.label}`,
                    color: EVENT_TYPES.CONFERENCE.color,
                    link: conf.link
                });
            }
        }
    });

    // Remove duplicates
    const uniqueEvents = events.filter(
        (item, index, self) =>
            index === self.findIndex(obj =>
            JSON.stringify(obj) === JSON.stringify(item)
        )
    );

    return uniqueEvents;
}
