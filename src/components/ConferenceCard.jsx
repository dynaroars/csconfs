import React, { useEffect, useState } from 'react';

// ── Date helpers ──────────────────────────────────────────────
const calculateTimeLeft = (deadline) => {
  const d = new Date(deadline);
  d.setHours(23, 59, 59, 999);
  const utc = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  utc.setUTCDate(utc.getUTCDate() + 1);
  utc.setUTCHours(11, 59, 59, 999);
  return utc - new Date();
};

const calculateCountdown = (deadline) => {
  if (!deadline) return '';
  const diff = calculateTimeLeft(deadline);
  if (diff <= 0) return 'Submission Passed';
  const days    = Math.floor(diff / 86400000);
  const hours   = Math.floor((diff / 3600000) % 24);
  const minutes = Math.floor((diff / 60000) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  if ([days, hours, minutes, seconds].some(isNaN)) return '';
  return `${String(days).padStart(2,'0')}d ${String(hours).padStart(2,'0')}h ${String(minutes).padStart(2,'0')}m ${String(seconds).padStart(2,'0')}s`;
};

const formatDateAoE = (date) => {
  if (!date) return 'TBD';
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  d.setHours(23, 59, 59, 999);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// ── Countdown color ──────────────────────────
const getCountdownColor = (deadline) => {
  if (!deadline) return 'var(--text-secondary)';
  const days = calculateTimeLeft(deadline) / 86400000;
  if (days < 0)   return 'var(--text-secondary)';
  if (days <= 7)  return '#d62728';
  if (days <= 30) return '#ff7f0e';
  return '#2ca02c';
};

// ── Card ──────────────────────────────────────────────────────
const ConferenceCard = ({ conference }) => {
  const [countdown, setCountdown] = useState(calculateCountdown(conference.deadline));

  useEffect(() => {
    const id = setInterval(() => setCountdown(calculateCountdown(conference.deadline)), 1000);
    return () => clearInterval(id);
  });

  const dateDisplay   = conference.parsed_date
    ? formatDateAoE(conference.parsed_date)
    : (conference.date ? String(conference.date) : 'TBD');

  const deadlineDisplay         = formatDateAoE(conference.deadline);
  const abstractDeadlineDisplay = conference.abstract_deadline ? formatDateAoE(conference.abstract_deadline) : '';
  const notificationDisplay     = formatDateAoE(conference.notification_date);
  const rebuttalDisplay         = conference.rebuttal_date ? formatDateAoE(conference.rebuttal_date) : '';
  const acceptanceRate          = conference.acceptance_rate
    ? (Math.round(conference.acceptance_rate * 100) / 100).toFixed(2) + '%'
    : null;

  const countdownColor = getCountdownColor(conference.deadline);

  return (
    <div className="conference-card-item split-card">
      {/* Left Column: Content */}
      <div className="split-card-left">
        <div className="conference-card-title">
          <a
            href={conference.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
            onMouseOver={e => e.target.style.textDecoration = 'underline'}
            onMouseOut={e => e.target.style.textDecoration = 'none'}
          >
            {conference.name} {conference.year}
          </a>
        </div>

        {/* Highlighted Date & Location */}
        <div style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>{dateDisplay}</span>
          {conference.place && (
            <>
              <span style={{ color: 'var(--border-color)', margin: '0 0.25rem' }}>|</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>{conference.place}</span>
            </>
          )}
        </div>

        {conference.description && (
          <div className="conference-card-description">
            {conference.description}
          </div>
        )}

        <div className="conference-card-meta-row" style={{ marginTop: 'auto' }}>
          {conference.program_chair && (
            <div className="conference-card-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Chair: {conference.program_chair}</span>
            </div>
          )}
          {acceptanceRate && (
            <div className="conference-card-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Acceptance: {acceptanceRate}</span>
            </div>
          )}
        </div>
        {conference.note && (
          <div className="conference-card-note">
            Note: {conference.note}
          </div>
        )}
      </div>

      {/* Right Column: Status Panel */}
      <div className="split-card-right status-panel">
        <div className="conference-card-countdown" style={{ color: countdownColor }}>
          {countdown || 'TBD'}
        </div>
        
        <div className="status-panel-deadlines">
          {abstractDeadlineDisplay && (
            <div className="status-deadline-row">
              <span className="status-deadline-label">Abstract</span>
              <span className="status-deadline-date">{abstractDeadlineDisplay}</span>
            </div>
          )}
          <div className="status-deadline-row">
            <span className="status-deadline-label">Submission</span>
            <span className="status-deadline-date">{deadlineDisplay}</span>
          </div>
          {rebuttalDisplay && (
            <div className="status-deadline-row">
              <span className="status-deadline-label">Rebuttal</span>
              <span className="status-deadline-date">{rebuttalDisplay}</span>
            </div>
          )}
          <div className="status-deadline-row">
            <span className="status-deadline-label">Notification</span>
            <span className="status-deadline-date">{notificationDisplay || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConferenceCard;
