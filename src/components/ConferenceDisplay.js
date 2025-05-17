import React, { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import Graph from './Graph';
import ConferenceCard from './ConferenceCard';

const sortFunctions = {
    deadline: (confs) =>
        confs.sort((a, b) => new Date(b.deadline) - new Date(a.deadline)),
    date: (confs) =>
        confs.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date) - new Date(b.date);
        }),
    alphabetical: (confs) => confs.sort((a, b) => a.name.localeCompare(b.name)),
    acceptanceRate: (confs) =>
        confs.sort((a, b) => b.acceptance_rate - a.acceptance_rate),
};

function ConferenceDisplay({ filteredConferences }) {
    // State to track current view: 'list' or 'graph'
    const [viewMode, setViewMode] = useState('list'); // default is list
    const [sortMode, setSortMode] = useState('deadline');
    const [sortFunction, setSortFunction] = useState(
        () => sortFunctions.deadline
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
                    <MenuItem value="deadline">Deadline</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="alphabetical">Alphabetical</MenuItem>
                    <MenuItem value="acceptanceRate">Acceptance rate</MenuItem>
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
