import React, { useEffect, useState } from 'react';

const EstimatedBadge = ({ children, title }) => (
  <span
    title={title}
    style={{
      backgroundColor: '#fff3e0',
      color: '#e65100',
      border: '1px solid #ffe0b2',
      borderRadius: '12px',
      padding: '2px 8px',
      fontSize: '0.75rem',
      fontWeight: 'bold',
      marginLeft: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      verticalAlign: 'middle',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </span>
);

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
const CycleStatusBlock = ({ cycle, isLast }) => {
  const [countdown, setCountdown] = useState(calculateCountdown(cycle.deadline));

  useEffect(() => {
    const id = setInterval(() => setCountdown(calculateCountdown(cycle.deadline)), 1000);
    return () => clearInterval(id);
  }, [cycle.deadline]);

  const deadlineDisplay         = formatDateAoE(cycle.deadline);
  const abstractDeadlineDisplay = cycle.abstract_deadline ? formatDateAoE(cycle.abstract_deadline) : '';
  const notificationDisplay     = formatDateAoE(cycle.notification_date);
  const rebuttalDisplay         = cycle.rebuttal_date ? formatDateAoE(cycle.rebuttal_date) : '';
  const countdownColor          = getCountdownColor(cycle.deadline);

  return (
    <div
      className="cycle-status-block"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
        paddingBottom: isLast ? 0 : '1rem',
        marginBottom: isLast ? 0 : '1rem',
      }}
    >
      {cycle.note && (
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            letterSpacing: '0.05em',
            marginBottom: '0.25rem',
          }}
        >
          {cycle.note}
        </div>
      )}

      <div className="conference-card-countdown" style={{ color: countdownColor, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
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
  );
};

const ConferenceCard = ({ conference }) => {
  const isGroup = Array.isArray(conference);
  const cycles  = isGroup ? conference : [conference];
  const mainConf = cycles[0];

  const [singleCountdown, setSingleCountdown] = useState(calculateCountdown(mainConf.deadline));

  useEffect(() => {
    if (!isGroup) {
      const id = setInterval(() => setSingleCountdown(calculateCountdown(mainConf.deadline)), 1000);
      return () => clearInterval(id);
    }
  }, [isGroup, mainConf.deadline]);

  const dateDisplay = mainConf.parsed_date
    ? formatDateAoE(mainConf.parsed_date)
    : (mainConf.date ? String(mainConf.date) : 'TBD');

  const deadlineDisplay         = formatDateAoE(mainConf.deadline);
  const abstractDeadlineDisplay = mainConf.abstract_deadline ? formatDateAoE(mainConf.abstract_deadline) : '';
  const notificationDisplay     = formatDateAoE(mainConf.notification_date);
  const rebuttalDisplay         = mainConf.rebuttal_date ? formatDateAoE(mainConf.rebuttal_date) : '';
  const acceptanceRate          = mainConf.acceptance_rate
    ? (Math.round(mainConf.acceptance_rate * 100) / 100).toFixed(2) + '%'
    : null;

  const countdownColor = getCountdownColor(mainConf.deadline);

  // General note (skip cycle notes on left panel when grouped)
  const leftNote = isGroup
    ? (mainConf.note && !mainConf.note.toLowerCase().includes('cycle') ? mainConf.note : null)
    : mainConf.note;

  return (
    <div className="conference-card-item split-card">
      {/* Left Column: Content */}
      <div className="split-card-left">
        <div className="conference-card-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href={mainConf.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
            onMouseOver={e => e.target.style.textDecoration = 'underline'}
            onMouseOut={e => e.target.style.textDecoration = 'none'}
          >
            {mainConf.name} {mainConf.year}
          </a>
          {mainConf.estimated && (
            <EstimatedBadge title="Dates are projected based on last year's timeline">
              Estimated
            </EstimatedBadge>
          )}
        </div>
        {mainConf.estimated && (
          <div style={{ color: '#e65100', fontSize: '0.75rem', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '0.5rem' }}>
            * Dates are estimated based on last year's calendar.
          </div>
        )}

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
          {mainConf.place && (
            <>
              <span style={{ color: 'var(--border-color)', margin: '0 0.25rem' }}>|</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>{mainConf.place}</span>
            </>
          )}
        </div>

        {mainConf.description && (
          <div className="conference-card-description">
            {mainConf.description}
          </div>
        )}

        <div className="conference-card-meta-row" style={{ marginTop: 'auto' }}>
          {mainConf.program_chair && (
            <div className="conference-card-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Chair: {mainConf.program_chair}</span>
            </div>
          )}
          {acceptanceRate && (
            <div className="conference-card-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Acceptance: {acceptanceRate}</span>
            </div>
          )}
        </div>
        {leftNote && (
          <div className="conference-card-note">
            Note: {leftNote}
          </div>
        )}
      </div>

      {/* Right Column: Status Panel */}
      <div className="split-card-right status-panel">
        {cycles.length > 1 ? (
          cycles.map((c, idx) => (
            <CycleStatusBlock key={idx} cycle={c} isLast={idx === cycles.length - 1} />
          ))
        ) : (
          <>
            <div className="conference-card-countdown" style={{ color: countdownColor }}>
              {singleCountdown || 'TBD'}
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
          </>
        )}
      </div>
    </div>
  );
};

export default ConferenceCard;
