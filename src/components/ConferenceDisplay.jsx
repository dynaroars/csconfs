import React, { useState, useEffect } from 'react';

import Graph from './Graph';
import ConferenceCard from './ConferenceCard';
import Stat from './Stat';
import Calendar from './Calendar/index';

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

            if (priorityA === PRIORITY.TBD || priorityB === PRIORITY.TBD) {
                if (a.year === b.year)
                    return a.name.localeCompare(b.name);
                return b.year - a.year
            }

            // When the deadlines passed, sorted by the closer deadline
            return deadlineB.getTime() - deadlineA.getTime();
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
                return deadlineB - deadlineA; // both passed
            }
            if (isAUpcoming) return -1;
            return 1;
        }),

    confdate: (confs) =>
        confs.sort((a, b) => {
            if (!a.parsed_date) return 1;
            if (!b.parsed_date) return -1;
            return b.parsed_date - a.parsed_date;
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
    const [viewMode, setViewMode] = useState('list');
    const [sortMode, setSortMode] = useState('submission_deadline');
    const [sortFunction, setSortFunction] = useState(
        () => sortFunctions.submission_deadline
    );
    const [showEstimated, setShowEstimated] = useState(true);

    const handleViewChange = (e) => {
        setViewMode(e.target.value);
    };
    const ITEMS_PER_PAGE = 25;
    const [page, setPage] = useState(1);

    const visibleConferences = showEstimated
        ? filteredConferences
        : filteredConferences.filter(conf => !conf.estimated);

    // reset to page 1 whenever the filter/search or showEstimated state changes so we never land on a blank page
    useEffect(() => { setPage(1); }, [filteredConferences, showEstimated]);

    const handleSortChange = (e) => {
        setSortMode(e.target.value);
        setSortFunction(() => sortFunctions[e.target.value]);
    };

    const sorted = sortFunction(visibleConferences);
    const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
    const paginated  = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const selectStyle = {
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-sm)',
        padding: '6px 10px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-color)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        outline: 'none',
        borderRadius: '4px',
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Controls row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', width: '100%' }}>
                <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    View
                </label>
                <select value={viewMode} onChange={handleViewChange} style={selectStyle}>
                    <option value="list">List</option>
                    <option value="calendar">Calendar</option>
                    <option value="graph">Graph</option>
                    <option value="stat">Statistics</option>
                </select>

                {viewMode === 'list' && (
                    <>
                        <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Sort
                        </label>
                        <select value={sortMode} onChange={handleSortChange} style={selectStyle}>
                            <option value="submission_deadline">Submission Deadline</option>
                            <option value="notification_date">Notification Date</option>
                            <option value="confdate">Conf. Date</option>
                            <option value="confplace">Location</option>
                        </select>
                    </>
                )}

                <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontFamily: 'var(--font-body)', 
                    fontSize: 'var(--text-sm)', 
                    color: 'var(--text-secondary)', 
                    fontWeight: 600, 
                    cursor: 'pointer', 
                    marginLeft: 'auto',
                    userSelect: 'none'
                }}>
                    <input 
                        type="checkbox" 
                        checked={showEstimated} 
                        onChange={(e) => setShowEstimated(e.target.checked)} 
                        style={{ 
                            cursor: 'pointer',
                            accentColor: '#e65100',
                            width: '16px',
                            height: '16px'
                        }}
                    />
                    Show Estimated
                </label>
            </div>

            {viewMode === 'calendar' && (
                <div style={{ width: '100%', marginBottom: 16 }}>
                    <Calendar conferences={visibleConferences} />
                </div>
            )}
            {viewMode === 'graph' && (
                <div style={{ width: '100%', marginBottom: 16 }}>
                    <Graph conferences={visibleConferences} />
                </div>
            )}
            {viewMode === 'stat' && (
                <div style={{ width: '100%', marginBottom: 16 }}>
                    <Stat conferences={visibleConferences} />
                </div>
            )}

            {viewMode === 'list' && (
                <div style={{ width: '100%' }}>
                    {paginated.map((conf) => (
                        <ConferenceCard
                            key={`${conf.name}-${conf.year}-${conf.note || ''}-${conf.link}`}
                            conference={conf}
                        />
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '24px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{ ...selectStyle, padding: '6px 14px', opacity: page === 1 ? 0.4 : 1 }}
                            >← Prev</button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                .reduce((acc, p, i, arr) => {
                                    if (i > 0 && p - arr[i-1] > 1) acc.push('…');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) => p === '…' ? (
                                    <span key={`ellipsis-${i}`} style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', padding: '0 4px' }}>…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        style={{
                                            ...selectStyle,
                                            padding: '6px 12px',
                                            fontWeight: p === page ? 700 : 400,
                                            background: p === page ? 'var(--text-primary)' : 'var(--bg-color)',
                                            color: p === page ? 'var(--bg-color)' : 'var(--text-primary)',
                                            borderColor: p === page ? 'var(--text-primary)' : 'var(--border-color)',
                                        }}
                                    >{p}</button>
                                ))
                            }

                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                style={{ ...selectStyle, padding: '6px 14px', opacity: page === totalPages ? 0.4 : 1 }}
                            >Next →</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ConferenceDisplay;
