import React, { useEffect, useState } from 'react';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
// import Box from '@mui/material/Box';

const StyledLink = styled(Link)({
  color: 'darkblue',
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
});

const calculateCountdown = (deadline) => {
  if (!deadline) return '';

  // Create a Date object from the provided deadline
  const deadlineDate = new Date(deadline);

  // Set it to the end of the day (23:59:59)
  deadlineDate.setHours(23, 59, 59, 999); // End of the specified date 

  // Convert this time to UTC
  const utcDeadlineDate = new Date(deadlineDate.getTime() + (deadlineDate.getTimezoneOffset() * 60000));

  // Adjust to the following day at 11:59 PM UTC-0
  utcDeadlineDate.setUTCDate(utcDeadlineDate.getUTCDate() + 1);
  utcDeadlineDate.setUTCHours(11, 59, 59, 999); // Set to 11:59 PM UTC-0

  const now = new Date();
  const diff = utcDeadlineDate - now;
  if (diff <= 0) return 'Submission Passed';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  if ([days, hours, minutes, seconds].some(isNaN)) return '';

  // return `${days}d, ${hours}h, ${minutes}m, ${seconds}s`;
  return `${String(days).padStart(2, '0')}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

// Function to format AoE dates
const formatDateAoE = (date) => {
  if (!date) return 'TBD';

  // Create a Date object
  const dateObject = new Date(date);
  
  // Increment to the end of the specified day
  dateObject.setHours(23, 59, 59, 999); // Set it to the end of the AoE day

  dateObject.setUTCDate(dateObject.getUTCDate() + 1); // Set to next day for display purposes
  return dateObject.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
};


const ConferenceCard = ({ conference }) => {
  const [countdown, setCountdown] = useState(calculateCountdown(conference.deadline));

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(conference.deadline));
    }, 1000);
    return () => clearInterval(interval);
  });

  // Format date range or fallback
  const dateRangeDisplay = conference.date
    ? formatDateAoE(conference.date)
    : 'TBD';

  const deadlineDisplay = conference.deadline
    ? formatDateAoE(conference.deadline)
    : 'TBD';

  const notificationDateDisplay = conference.notification_date
    ? formatDateAoE(conference.notification_date)
    : 'TBD';

  const acceptance_rate = conference.acceptance_rate
    ? (Math.round(conference.acceptance_rate * 10000) / 100).toFixed(2) + '%'
    : 'N/A';

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: '5px',
        padding: 1,
        marginBottom: 2, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 100,
      }}
    >
      {/* Left column: name, description, area */}
      <CardContent sx={{ flexBasis: '50%', padding: 0, }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          <StyledLink href={conference.link} target="_blank" rel="noopener noreferrer">
            {conference.name} {conference.year}
          </StyledLink>
        </Typography>
        <Typography variant="body2" sx={{ marginBottom: 0., color: 'text.secondary', fontSize: 'var(--font-size-body)' }}>
          {conference.description}
        </Typography>
        
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontStyle: 'italic', color: 'text.secondary', fontSize: 'var(--font-size-body)' }}>
          {conference.note}
        </Typography>
        
        {conference.general_chair && <Typography variant="body2" sx={{ fontWeight: 'normal', marginBottom: 0, color: 'text.secondary', fontSize: 'var(--font-size-body)', }}>
          General Chair:{' '} {conference.general_chair}
        </Typography>}

        {conference.program_chair && <Typography variant="body2" sx={{ fontWeight: 'normal', marginBottom: 0, color: 'text.secondary', fontSize: 'var(--font-size-body)', }}>
          Program Chair:{' '} {conference.program_chair}
        </Typography>}



        {acceptance_rate !== 'N/A' && (
          <Typography variant="subtitle2" sx={{ fontStyle: 'italic', fontSize: 'var(--font-size-body)' }}>
            Acceptance rate: {acceptance_rate}
          </Typography>
        )}

      </CardContent>

      {/* Center column: date range and location */}
      <CardContent
        sx={{
          flexBasis: '25%',
          textAlign: 'right',
          color: 'text.black',
          fontWeight: 'medium',
          fontSize: 'var(--font-size-body)',
          padding: 0,
        }}
      >
        <Typography sx={{ fontSize: 'var(--font-size-body)' }}>
          {dateRangeDisplay}
        </Typography>
        {conference.place}
      </CardContent>

      {/* Right column: countdown and deadline */}
      <CardContent 
        sx={{ 
          flexBasis: '35%', 
          textAlign: 'right',
          paddingRight: 0,
        }}
      >
        <Typography variant="h5" fontWeight="bold" color="error.main" sx={{ fontSize: 'var(--font-size-title)' }}>
          {countdown || 'TBD'}
        </Typography>
        <Typography sx={{ fontSize: 'var(--font-size-body)' }}>
          Submission: {deadlineDisplay}
        </Typography>
        <Typography sx={{ fontSize: 'var(--font-size-body)' }}>
          Notification: {notificationDateDisplay}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ConferenceCard;