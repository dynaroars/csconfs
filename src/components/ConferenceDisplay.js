import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import Graph from './Graph';
import ConferenceCard from './ConferenceCard';

function getAoEAdjustedDeadline(deadline) {
    if (!deadline) return null;
    const dateObject = new Date(deadline);
    dateObject.setHours(23, 59, 59, 999);
    dateObject.setUTCDate(dateObject.getUTCDate() + 1);
    return dateObject;
}

/*
    Priorities:
    1 - upcoming deadlines
    2 - TBD (no deadline)
    3 - passed deadlines
*/
const PRIORITY = {
    UPCOMING_DEADLINE: 1,
    TBD: 2,
    PASSED_DEADLINE: 3
}

const sortFunctions = {
    submission_deadline: (confs) =>
        confs.sort((a, b) => {
            const now = new Date();
            const getNowAoe = () => {
                const nowDate = new Date(now.getTime() + 12 * 60 * 60 * 1000);
                return new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate()));
            };
            const nowAoe = getNowAoe();
            const deadlineA = getAoEAdjustedDeadline(a.deadline);
            const deadlineB = getAoEAdjustedDeadline(b.deadline);
            

            // Assign priority values
            const getPriority = (conf) => {
                if (!conf) return PRIORITY.TBD;
                if (!conf.deadline) return PRIORITY.TBD;
                const deadlineDate = getAoEAdjustedDeadline(conf.deadline);
                if (!deadlineDate) return PRIORITY.TBD;
                if (deadlineDate.getTime() >= nowAoe.getTime()) return PRIORITY.UPCOMING_DEADLINE;
                return PRIORITY.PASSED_DEADLINE;
            };

            const priorityA = getPriority(a);
            const priorityB = getPriority(b);

            if (priorityA !== priorityB) return priorityA - priorityB;

            // Same priority, order by deadline if present, otherwise equal
            if (priorityA === PRIORITY.UPCOMING_DEADLINE) {
                // Both upcoming, sort by countdown ascending
                return deadlineA.getTime() - deadlineB.getTime();
            }
            return 0; // TBD or passed both equal
        }),
    notification_date: (confs) =>
        confs.sort((a, b) => {
            const now = new Date();
            const deadlineA = getAoEAdjustedDeadline(a.notification_date);
            const deadlineB = getAoEAdjustedDeadline(b.notification_date);

            // Defensive: if invalid dates, put them last
            if (!deadlineA && !deadlineB) return 0;
            if (!deadlineA) return 1;
            if (!deadlineB) return -1;

            const isAUpcoming = deadlineA > now;
            const isBUpcoming = deadlineB > now;

            if (isAUpcoming && isBUpcoming) {
                return deadlineA - deadlineB;
            }
            if (!isAUpcoming && !isBUpcoming) {
                return 0; // both passed
            }
            if (isAUpcoming) return -1;
            return 1;
        }),

    confdate: (confs) =>
        confs.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date) - new Date(b.date);
        }),
    confname: (confs) => confs.sort((a, b) => a.name.localeCompare(b.name)),
    confplace: (confs) =>
        confs.sort((a, b) => {
        const getCountry = (place) => {
        if (!place) return ""; // handle missing place
        const parts = place.split(",");
        return parts[parts.length - 1].trim().toLowerCase();
        };
        return getCountry(a.place).localeCompare(getCountry(b.place));
    }),
    acceptanceRate: (confs) =>
        confs.sort((a, b) => b.acceptance_rate - a.acceptance_rate),
};

function ConferenceDisplay({ filteredConferences }) {
    // State to track current view: 'list' or 'graph'
    const [viewMode, setViewMode] = useState('list'); // default is list
    const [sortMode, setSortMode] = useState('submission_deadline');
    const [sortFunction, setSortFunction] = useState(
        () => sortFunctions.submission_deadline
    );

    const handleViewChange = (e) => {
        setViewMode(e.target.value);
    };

    const handleSortChange = (e) => {
        setSortMode(e.target.value);
        setSortFunction(() => sortFunctions[e.target.value]);
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Dropdown selector */}
            <FormControl sx={{ minWidth: 150, marginBottom: 2 }} size="small">
                <InputLabel id="view-select-label">View</InputLabel>
                <Select
                    labelId="view-select-label"
                    id="view-select"
                    value={viewMode}
                    label="View"
                    onChange={handleViewChange}
                >
                    <MenuItem value="list">List View</MenuItem>
                    <MenuItem value="graph">Graph View</MenuItem>
                </Select>
            </FormControl>

            {/* Dropdown selector for conference sorting */}
            <FormControl
                sx={{ marginLeft: 2, minWidth: 150, marginBottom: 2 }}
                size="small"
            >
                <InputLabel id="sort-select-label">Sort</InputLabel>
                <Select
                    labelId="sort-select-label"
                    id="sort-select"
                    value={sortMode}
                    label="Sort"
                    onChange={handleSortChange}
                >
                    <MenuItem value="submission_deadline">Submission Deadline</MenuItem>
                    <MenuItem value="notification_date">Notification Date</MenuItem>
                    <MenuItem value="confdate">Conf. Date</MenuItem>
                    {/* <MenuItem value="confname">Conf. Name</MenuItem> */}
                    <MenuItem value="confplace">Conf. Location (Country)</MenuItem>
                    {/* <MenuItem value="acceptanceRate">Acceptance Rate</MenuItem> */}
                </Select>
            </FormControl>

            {/* Conditionally render based on view */}
            {viewMode === 'graph' && (
                <div style={{ width: '100%', marginBottom: 16 }}>
                    <Graph conferences={filteredConferences} />
                </div>
            )}

            {viewMode === 'list' && (
                <div className="conference-card" style={{ width: '100%' }}>
                    {sortFunction(filteredConferences).map((conf) => (
                        <ConferenceCard
                            key={`${conf.name}-${conf.year}-${conf.note}`}
                            conference={conf}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ConferenceDisplay;
