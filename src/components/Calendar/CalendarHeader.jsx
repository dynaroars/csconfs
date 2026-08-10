import React from 'react';
import PropTypes from 'prop-types';
import { MONTH_NAMES } from './constants';

/**
 * Calendar header with month/year display and navigation buttons.
 */
function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth }) {
    return (
        <div className="calendar-header">
            <button
                type="button"
                className="calendar-nav"
                onClick={onPreviousMonth}
                aria-label="Previous month"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                </svg>
            </button>
            <h2 className="calendar-title" aria-live="polite">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
                type="button"
                className="calendar-nav"
                onClick={onNextMonth}
                aria-label="Next month"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                </svg>
            </button>
        </div>
    );
}

CalendarHeader.propTypes = {
    currentDate: PropTypes.instanceOf(Date).isRequired,
    onPreviousMonth: PropTypes.func.isRequired,
    onNextMonth: PropTypes.func.isRequired
};

export default CalendarHeader;
