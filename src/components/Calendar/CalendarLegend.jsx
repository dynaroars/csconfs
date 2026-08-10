import React from 'react';
import { EVENT_TYPES } from './constants';

/**
 * Calendar legend showing event type colors.
 */
function CalendarLegend() {
    return (
        <div className="calendar-legend" role="list" aria-label="Calendar legend">
            {Object.values(EVENT_TYPES).map(eventType => (
                <div key={eventType.type} className="calendar-legend-item" role="listitem">
                    <span
                        className="calendar-legend-swatch"
                        style={{ backgroundColor: eventType.color }}
                        aria-hidden="true"
                    />
                    {eventType.legendLabel}
                </div>
            ))}
        </div>
    );
}

export default CalendarLegend;
