import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, useTheme, useMediaQuery } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

// ============================================================================
// CONSTANTS
// ============================================================================

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const EVENT_TYPES = {
    DEADLINE: {
        type: 'deadline',
        label: 'Deadline',
        color: '#d32f2f',
        legendLabel: 'Submission Deadline'
    },
    ABSTRACT: {
        type: 'abstract',
        label: 'Abstract',
        color: '#f57c00',
        legendLabel: 'Abstract Deadline'
    },
    NOTIFICATION: {
        type: 'notification',
        label: 'Notification',
        color: '#1976d2',
        legendLabel: 'Notification Date'
    },
    CONFERENCE: {
        type: 'conference',
        label: 'Conf',
        color: '#388e3c',
        legendLabel: 'Conference Date'
    }
};

const DAYS_IN_WEEK = 7;
const MIN_CALENDAR_HEIGHT = 100;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Adjusts a deadline to Anywhere on Earth (AoE) timezone.
 * AoE is UTC-12, so we add 12 hours to account for the timezone difference.
 *
 * @param {string | Date} deadline - The deadline date to adjust
 * @returns {Date | null} The AoE-adjusted date or null if invalid
 */
function getAoEAdjustedDeadline(deadline) {
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
function formatDateToISO(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Checks if two dates are the same day.
 *
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if dates are the same day
 */
function isSameDay(date1, date2) {
    return formatDateToISO(date1) === formatDateToISO(date2);
}

/**
 * Gets normalized today's date (time set to 00:00:00).
 *
 * @returns {Date} Today's date at midnight
 */
function getTodayNormalized() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// ============================================================================
// CALENDAR LOGIC
// ============================================================================

/**
 * Generates an array of calendar days for the given month, including
 * trailing days from previous month and leading days from next month.
 *
 * @param {Date} currentDate - The date representing the current month
 * @returns {Array<{date: number, isCurrentMonth: boolean, fullDate: Date}>}
 */
function generateCalendarDays(currentDate) {
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
function getConferencesForDay(conferences, dayDate) {
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

    return events;
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * Calendar header with month/year display and navigation buttons.
 */
function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1
            }}
        >
            <IconButton
                onClick={onPreviousMonth}
                aria-label="Previous month"
                size="small"
            >
                <ChevronLeft />
            </IconButton>
            <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 600 }}
                aria-live="polite"
            >
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton
                onClick={onNextMonth}
                aria-label="Next month"
                size="small"
            >
                <ChevronRight />
            </IconButton>
        </Box>
    );
}

CalendarHeader.propTypes = {
    currentDate: PropTypes.instanceOf(Date).isRequired,
    onPreviousMonth: PropTypes.func.isRequired,
    onNextMonth: PropTypes.func.isRequired
};

/**
 * Day names header row.
 */
function DayNamesHeader({ isMobile }) {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                mb: 1
            }}
            role="row"
        >
            {DAY_NAMES.map(day => (
                <Box
                    key={day}
                    sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'text.secondary',
                        p: 1,
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }}
                    role="columnheader"
                >
                    {day}
                </Box>
            ))}
        </Box>
    );
}

DayNamesHeader.propTypes = {
    isMobile: PropTypes.bool.isRequired
};

/**
 * Individual calendar day cell.
 */
function CalendarDay({ day, events, isToday, isMobile }) {
    return (
        <Box
            sx={{
                minHeight: isMobile ? 80 : MIN_CALENDAR_HEIGHT,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                backgroundColor: day.isCurrentMonth ? 'background.paper' : 'grey.50',
                position: 'relative',
                transition: 'background-color 0.2s',
                '&:hover': {
                    backgroundColor: day.isCurrentMonth ? 'grey.50' : 'grey.100'
                }
            }}
            role="gridcell"
            aria-label={`${day.fullDate.toLocaleDateString()}, ${events.length} events`}
        >
            {/* Day Number */}
            <Typography
                sx={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem',
                    fontWeight: isToday ? 700 : 500,
                    color: day.isCurrentMonth
                        ? (isToday ? 'primary.main' : 'text.primary')
                        : 'text.disabled',
                    mb: 0.5
                }}
            >
                {day.date}
            </Typography>

            {/* Events */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {events.map((event, idx) => (
                    event.link ? (
                        <Box
                            key={`${event.type}-${idx}`}
                            component="a"
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${event.label} - Click to view conference website`}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: event.color,
                                color: 'white',
                                fontSize: isMobile ? '0.6rem' : '0.65rem',
                                height: isMobile ? 18 : 20,
                                borderRadius: '10px',
                                px: 0.5,
                                cursor: 'pointer',
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                '&:hover': {
                                    opacity: 0.8
                                }
                            }}
                        >
                            {event.label}
                        </Box>
                    ) : (
                        <Box
                            key={`${event.type}-${idx}`}
                            aria-label={event.label}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: event.color,
                                color: 'white',
                                fontSize: isMobile ? '0.6rem' : '0.65rem',
                                height: isMobile ? 18 : 20,
                                borderRadius: '10px',
                                px: 0.5,
                                cursor: 'default',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {event.label}
                        </Box>
                    )
                ))}
            </Box>
        </Box>
    );
}

CalendarDay.propTypes = {
    day: PropTypes.shape({
        date: PropTypes.number.isRequired,
        isCurrentMonth: PropTypes.bool.isRequired,
        fullDate: PropTypes.instanceOf(Date).isRequired
    }).isRequired,
    events: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        link: PropTypes.string
    })).isRequired,
    isToday: PropTypes.bool.isRequired,
    isMobile: PropTypes.bool.isRequired
};

/**
 * Calendar legend showing event type colors.
 */
function CalendarLegend({ isMobile }) {
    return (
        <Box
            sx={{
                mt: 3,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                display: 'flex',
                gap: isMobile ? 1.5 : 2,
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}
            role="list"
            aria-label="Calendar legend"
        >
            {Object.values(EVENT_TYPES).map(eventType => (
                <Box
                    key={eventType.type}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    role="listitem"
                >
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: eventType.color,
                            borderRadius: 0.5
                        }}
                        aria-hidden="true"
                    />
                    <Typography variant={isMobile ? "caption" : "body2"}>
                        {eventType.legendLabel}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

CalendarLegend.propTypes = {
    isMobile: PropTypes.bool.isRequired
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Calendar component for displaying conference deadlines and events.
 * Shows a monthly calendar view with color-coded events for deadlines,
 * abstract deadlines, notifications, and conference dates.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.conferences - Array of conference objects
 * @returns {JSX.Element} Calendar component
 */
function Calendar({ conferences }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Navigation handlers
    const handlePreviousMonth = useCallback(() => {
        setCurrentDate(prevDate =>
            new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1)
        );
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prevDate =>
            new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1)
        );
    }, []);

    // Memoized calendar days to avoid recalculation on every render
    const calendarDays = useMemo(
        () => generateCalendarDays(currentDate),
        [currentDate]
    );

    // Memoized today's date
    const today = useMemo(() => getTodayNormalized(), []);

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: 1400,
                margin: '0 auto',
                px: isMobile ? 1 : 0
            }}
            role="region"
            aria-label="Conference deadline calendar"
        >
            <CalendarHeader
                currentDate={currentDate}
                onPreviousMonth={handlePreviousMonth}
                onNextMonth={handleNextMonth}
            />

            <DayNamesHeader isMobile={isMobile} />

            {/* Calendar Grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: isMobile ? 0.5 : 1
                }}
                role="grid"
                aria-label="Calendar days"
            >
                {calendarDays.map((day, index) => {
                    const events = getConferencesForDay(conferences, day.fullDate);
                    const isToday = isSameDay(day.fullDate, today);

                    return (
                        <CalendarDay
                            key={`${day.fullDate.toISOString()}-${index}`}
                            day={day}
                            events={events}
                            isToday={isToday}
                            isMobile={isMobile}
                        />
                    );
                })}
            </Box>

            <CalendarLegend isMobile={isMobile} />
        </Box>
    );
}

Calendar.propTypes = {
    conferences: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            deadline: PropTypes.string,
            abstract_deadline: PropTypes.string,
            notification_date: PropTypes.string,
            date: PropTypes.string,
            link: PropTypes.string
        })
    ).isRequired
};

Calendar.defaultProps = {
    conferences: []
};

export default Calendar;
