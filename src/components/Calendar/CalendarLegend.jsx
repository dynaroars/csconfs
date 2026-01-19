import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { EVENT_TYPES } from './constants';

/**
 * Calendar legend showing event type colors.
 */
function CalendarLegend({ isMobile }) {
    return (
        <Box
            sx={{
                mt: 3,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                display: 'flex',
                gap: isMobile ? 1.5 : 2,
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}
            role="list"
            aria-label="Calendar legend"
        >
            {Object.values(EVENT_TYPES).map(eventType => (
                <Box
                    key={eventType.type}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    role="listitem"
                >
                    <Box
                        sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: eventType.color,
                            borderRadius: 0.5
                        }}
                        aria-hidden="true"
                    />
                    <Typography variant={isMobile ? "caption" : "body2"}>
                        {eventType.legendLabel}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}

CalendarLegend.propTypes = {
    isMobile: PropTypes.bool.isRequired
};

export default CalendarLegend;
