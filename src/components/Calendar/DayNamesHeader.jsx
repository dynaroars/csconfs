import React from 'react';
import { DAY_NAMES } from './constants';

/**
 * Day names header row.
 */
function DayNamesHeader() {
    return (
        <div className="calendar-daynames" role="row">
            {DAY_NAMES.map(day => (
                <div key={day} className="calendar-dayname" role="columnheader">
                    {day}
                </div>
            ))}
        </div>
    );
}

export default DayNamesHeader;
