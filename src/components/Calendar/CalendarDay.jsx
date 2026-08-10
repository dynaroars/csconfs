import React from 'react';
import PropTypes from 'prop-types';

/**
 * Individual calendar day cell.
 */
function CalendarDay({ day, events, isToday }) {
    const classes = [
        'calendar-day',
        day.isCurrentMonth ? '' : 'is-outside-month',
        isToday ? 'is-today' : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            role="gridcell"
            aria-label={`${day.fullDate.toLocaleDateString()}, ${events.length} events`}
        >
            <div className="calendar-daynum">{day.date}</div>

            <div className="calendar-events">
                {events.map((event, idx) => (
                    event.link ? (
                        <a
                            key={`${event.type}-${idx}`}
                            className="calendar-event"
                            style={{ backgroundColor: event.color }}
                            href={event.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${event.label} - Click to view conference website`}
                        >
                            {event.label}
                        </a>
                    ) : (
                        <span
                            key={`${event.type}-${idx}`}
                            className="calendar-event"
                            style={{ backgroundColor: event.color }}
                            aria-label={event.label}
                        >
                            {event.label}
                        </span>
                    )
                ))}
            </div>
        </div>
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
    isToday: PropTypes.bool.isRequired
};

export default CalendarDay;
