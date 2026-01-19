import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { MIN_CALENDAR_HEIGHT } from './constants';

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

export default CalendarDay;
