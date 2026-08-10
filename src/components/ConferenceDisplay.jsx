import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';

import ConferenceCard from './ConferenceCard';
import Calendar from './Calendar/index';

// Graph and Stat are the only recharts consumers, and neither is on the default
// (list) view — load them on demand so recharts stays out of the initial bundle.
const Graph = lazy(() => import('./Graph'));
const Stat = lazy(() => import('./Stat'));

const ChartFallback = () => <p className="placeholder">Loading chart&hellip;</p>;

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

    const visibleConferences = useMemo(
        () => showEstimated
            ? [...filteredConferences]
            : filteredConferences.filter(conf => !conf.estimated),
        [filteredConferences, showEstimated]
    );

    // reset to page 1 when active search/topic filters change
    useEffect(() => { setPage(1); }, [filteredConferences]);

    const handleSortChange = (e) => {
        setSortMode(e.target.value);
        setSortFunction(() => sortFunctions[e.target.value]);
    };

    const sorted = useMemo(
        () => sortFunction([...visibleConferences]),
        [visibleConferences, sortFunction]
    );

    const groupedSorted = useMemo(() => {
        const groups = [];
        const map = new Map();
        for (const conf of sorted) {
            const key = `${conf.name}__${conf.year}`;
            if (map.has(key)) {
                groups[map.get(key)].push(conf);
            } else {
                map.set(key, groups.length);
                groups.push([conf]);
            }
        }
        for (const group of groups) {
            if (group.length > 1) {
                group.sort((a, b) => {
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                });
            }
        }
        return groups;
    }, [sorted]);

    const totalPages = Math.max(1, Math.ceil(groupedSorted.length / ITEMS_PER_PAGE));
    const paginated  = groupedSorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // clamp page to valid range if totalPages shrinks (e.g., toggling showEstimated)
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [totalPages, page]);

    return (
        <div className="display">
            {/* Controls row */}
            <div className="controls">
                <label className="control-label" htmlFor="view-mode">View</label>
                <select id="view-mode" className="control-select" value={viewMode} onChange={handleViewChange}>
                    <option value="list">List</option>
                    <option value="calendar">Calendar</option>
                    <option value="graph">Graph</option>
                    <option value="stat">Statistics</option>
                </select>

                {viewMode === 'list' && (
                    <>
                        <label className="control-label" htmlFor="sort-mode">Sort</label>
                        <select id="sort-mode" className="control-select" value={sortMode} onChange={handleSortChange}>
                            <option value="submission_deadline">Submission Deadline</option>
                            <option value="notification_date">Notification Date</option>
                            <option value="confdate">Conf. Date</option>
                            <option value="confplace">Location</option>
                        </select>
                    </>
                )}

                <label className="control-label control-checkbox">
                    <input
                        type="checkbox"
                        checked={showEstimated}
                        onChange={(e) => setShowEstimated(e.target.checked)}
                    />
                    Show Estimated
                </label>
            </div>

            {viewMode === 'calendar' && <Calendar conferences={visibleConferences} />}

            {viewMode === 'graph' && (
                <Suspense fallback={<ChartFallback />}>
                    <Graph conferences={visibleConferences} />
                </Suspense>
            )}

            {viewMode === 'stat' && (
                <Suspense fallback={<ChartFallback />}>
                    <Stat conferences={visibleConferences} />
                </Suspense>
            )}

            {viewMode === 'list' && (
                <div>
                    {paginated.map((group) => {
                        const mainConf = group[0];
                        return (
                            <ConferenceCard
                                key={`${mainConf.name}-${mainConf.year}`}
                                conference={group.length === 1 ? mainConf : group}
                            />
                        );
                    })}

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                type="button"
                                className="page-btn"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >&larr; Prev</button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                                .reduce((acc, p, i, arr) => {
                                    if (i > 0 && p - arr[i - 1] > 1) acc.push('\u2026');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((p, i) => p === '\u2026' ? (
                                    <span key={`ellipsis-${i}`} className="page-ellipsis">&hellip;</span>
                                ) : (
                                    <button
                                        key={p}
                                        type="button"
                                        className={`page-btn${p === page ? ' is-current' : ''}`}
                                        onClick={() => setPage(p)}
                                        aria-current={p === page ? 'page' : undefined}
                                    >{p}</button>
                                ))
                            }

                            <button
                                type="button"
                                className="page-btn"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >Next &rarr;</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ConferenceDisplay;
