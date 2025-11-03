/**
 * Calendar constants
 * Centralized configuration for the calendar component
 */

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const EVENT_TYPES = {
    DEADLINE: {
        type: 'deadline',
        label: 'Deadline',
        color: '#d32f2f',
        legendLabel: 'Submission Deadline'
    },
    ABSTRACT: {
        type: 'abstract',
        label: 'Abstract',
        color: '#f57c00',
        legendLabel: 'Abstract Deadline'
    },
    NOTIFICATION: {
        type: 'notification',
        label: 'Notification',
        color: '#1976d2',
        legendLabel: 'Notification Date'
    },
    CONFERENCE: {
        type: 'conference',
        label: 'Conf',
        color: '#388e3c',
        legendLabel: 'Conference Date'
    }
};

export const DAYS_IN_WEEK = 7;
export const MIN_CALENDAR_HEIGHT = 100;
