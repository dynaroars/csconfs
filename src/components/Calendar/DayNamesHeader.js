import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { DAY_NAMES } from './constants';

/**
 * Day names header row.
 */
function DayNamesHeader({ isMobile }) {
    return (
        <Box
            sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 1,
                mb: 1
            }}
            role="row"
        >
            {DAY_NAMES.map(day => (
                <Box
                    key={day}
                    sx={{
                        textAlign: 'center',
                        fontWeight: 600,
                        color: 'text.secondary',
                        p: 1,
                        fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }}
                    role="columnheader"
                >
                    {day}
                </Box>
            ))}
        </Box>
    );
}

DayNamesHeader.propTypes = {
    isMobile: PropTypes.bool.isRequired
};

export default DayNamesHeader;
