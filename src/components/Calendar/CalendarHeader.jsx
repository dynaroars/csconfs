import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { MONTH_NAMES } from './constants';

/**
 * Calendar header with month/year display and navigation buttons.
 */
function CalendarHeader({ currentDate, onPreviousMonth, onNextMonth }) {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 3,
                p: 2,
                backgroundColor: 'var(--hover-bg)',
                borderRadius: 1,
            }}
        >
            <IconButton
                onClick={onPreviousMonth}
                aria-label="Previous month"
                size="small"
            >
                <ChevronLeft />
            </IconButton>
            <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 600 }}
                aria-live="polite"
            >
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton
                onClick={onNextMonth}
                aria-label="Next month"
                size="small"
            >
                <ChevronRight />
            </IconButton>
        </Box>
    );
}

CalendarHeader.propTypes = {
    currentDate: PropTypes.instanceOf(Date).isRequired,
    onPreviousMonth: PropTypes.func.isRequired,
    onNextMonth: PropTypes.func.isRequired
};

export default CalendarHeader;
