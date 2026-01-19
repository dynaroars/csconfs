import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, useTheme, useMediaQuery } from '@mui/material';

import CalendarHeader from './CalendarHeader';
import DayNamesHeader from './DayNamesHeader';
import CalendarDay from './CalendarDay';
import CalendarLegend from './CalendarLegend';
import { generateCalendarDays, getConferencesForDay, getTodayNormalized, isSameDay } from './utils';

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
