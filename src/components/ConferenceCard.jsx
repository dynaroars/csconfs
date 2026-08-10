import React, { useEffect, useState } from 'react';

const EstimatedBadge = ({ children, title }) => (
  <span className="badge-estimated" title={title}>
    {children}
  </span>
);

const VisualCycleStepper = ({ cycles }) => {
  if (!cycles || cycles.length <= 1) return null;

  return (
    <div className="cycle-stepper">
      {cycles.map((c, i) => {
        const diff = c.deadline ? calculateTimeLeft(c.deadline) : -1;
        const isPassed = diff <= 0;
        const label = c.note || `Cycle ${i+1}`;
        return (
          <React.Fragment key={i}>
            <div
              className={`cycle-step${isPassed ? ' is-passed' : ''}`}
              title={`${label}: ${formatDateAoE(c.deadline)}`}
            >
              <span className="cycle-dot" />
              <span>{label}</span>
            </div>
            {i < cycles.length - 1 && <span className="cycle-sep">&mdash;</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

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

// Dates in the database are calendar dates, not instants, so they are rendered
// exactly as recorded. Building a Date and shifting it made the displayed day
// depend on the viewer's timezone, and disagree with the calendar view.
// The AoE offset only affects "time remaining", which the countdown handles.
const formatDateAoE = (date) => {
  if (!date) return 'TBD';
  // parsed_date arrives as a Date; read its local calendar date, not UTC.
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return 'TBD';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}/${date.getFullYear()}`;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date));
  if (!match) return date;
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
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
    <div className={`cycle-status-block${isLast ? ' is-last' : ''}`}>
      {cycle.note && (
        <div className="cycle-note">{cycle.note}</div>
      )}

      <div className="conference-card-countdown is-compact" style={{ color: countdownColor }}>
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

  const [expanded, setExpanded] = useState(false);

  // Find active cycle index (first cycle where deadline > now)
  const activeCycleIdx = React.useMemo(() => {
    if (!isGroup) return 0;
    const now = new Date();
    const idx = cycles.findIndex(c => {
      if (!c.deadline) return false;
      const d = new Date(c.deadline);
      d.setHours(23, 59, 59, 999);
      return d >= now;
    });
    return idx >= 0 ? idx : 0;
  }, [isGroup, cycles]);

  const shouldCollapse = isGroup && cycles.length > 2;
  const displayedCycles = (shouldCollapse && !expanded) ? [cycles[activeCycleIdx]] : cycles;

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
        <div className="conference-card-title">
          <a
            href={mainConf.link}
            target="_blank"
            rel="noopener noreferrer"
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
          <div className="estimated-note">
            * Dates are estimated based on last year's calendar.
          </div>
        )}

        {isGroup && cycles.length > 1 && (
          <VisualCycleStepper cycles={cycles} />
        )}

        {/* Highlighted Date & Location */}
        <div className="card-when-where">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>{dateDisplay}</span>
          {mainConf.place && (
            <>
              <span className="card-sep">|</span>
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

        <div className="conference-card-meta-row">
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
          <>
            {displayedCycles.map((c, idx) => (
              <CycleStatusBlock key={idx} cycle={c} isLast={idx === displayedCycles.length - 1} />
            ))}

            {shouldCollapse && (
              <button
                type="button"
                className="cycle-expand-btn"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Collapse cycles' : `Show all ${cycles.length} cycles`}
              </button>
            )}
          </>
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
