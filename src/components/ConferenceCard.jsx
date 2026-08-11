import React, { useEffect, useState } from 'react';

import { aoeTimeLeft } from '../utils/deadline';

// ── Date helpers ──────────────────────────────────────────────

const countdownText = (deadline) => {
  const diff = aoeTimeLeft(deadline);
  if (diff === null) return '';
  if (diff <= 0) return 'Passed';
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(diff / 86400000))}d ${pad(Math.floor((diff / 3600000) % 24))}h `
       + `${pad(Math.floor((diff / 60000) % 60))}m ${pad(Math.floor((diff / 1000) % 60))}s`;
};

/**
 * Dates in the database are calendar dates, not instants, so they are rendered
 * exactly as recorded. Building a Date and shifting it made the displayed day
 * depend on the viewer's timezone, and disagree with the calendar view.
 * The AoE offset only affects "time remaining", which the countdown handles.
 */
const formatDate = (date) => {
  if (!date) return '';
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return '';
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(date));
  return m ? `${m[2]}/${m[3]}/${m[1]}` : String(date);
};

const urgencyClass = (deadline) => {
  const diff = aoeTimeLeft(deadline);
  if (diff === null) return '';
  const days = diff / 86400000;
  if (days < 0) return ' is-passed';
  if (days <= 7) return ' is-urgent';
  if (days <= 30) return ' is-soon';
  return '';
};

// ── Countdown ticker ──────────────────────────────────────────

// One timer drives every countdown on the page. A page of 25 cards, several of
// them multi-cycle, used to hold ~50 independent one-second intervals, each
// waking React on its own; now the whole page re-renders once a second.
const tickListeners = new Set();
let tickTimer = null;

function subscribeToTick(listener) {
  tickListeners.add(listener);
  if (tickTimer === null) {
    tickTimer = setInterval(() => {
      // React batches these, so N listeners still cost one render pass.
      tickListeners.forEach(fn => fn());
    }, 1000);
  }

  return () => {
    tickListeners.delete(listener);
    if (tickListeners.size === 0) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
}

/** Live-ticking countdown string for one deadline. */
function useCountdown(deadline) {
  const [text, setText] = useState(() => countdownText(deadline));

  useEffect(() => {
    setText(countdownText(deadline));

    // A deadline that has already expired reads "Passed" forever; one that
    // expires while the page is open is caught by the subscription below.
    const remaining = aoeTimeLeft(deadline);
    if (remaining === null || remaining <= 0) return undefined;

    return subscribeToTick(() => setText(countdownText(deadline)));
  }, [deadline]);

  return text;
}

// ── Card ──────────────────────────────────────────────────────

/**
 * One submission cycle: its countdown and the dates behind it. A conference
 * with a single deadline is just a one-cycle conference.
 */
const Cycle = ({ cycle, showLabel }) => {
  const countdown = useCountdown(cycle.deadline);

  const dates = [
    ['Abstract', formatDate(cycle.abstract_deadline)],
    ['Submission', formatDate(cycle.deadline)],
    ['Rebuttal', formatDate(cycle.rebuttal_date)],
    ['Notification', formatDate(cycle.notification_date)],
  ].filter(([, value]) => value);

  return (
    <div className="cycle">
      {showLabel && cycle.note && <p className="cycle-label">{cycle.note}</p>}
      <p className={`countdown${urgencyClass(cycle.deadline)}`}>{countdown || 'TBD'}</p>
      <dl className="dates">
        {dates.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

const ConferenceCard = ({ conference }) => {
  const cycles = Array.isArray(conference) ? conference : [conference];
  const main = cycles[0];
  const multi = cycles.length > 1;

  const [expanded, setExpanded] = useState(false);

  // Default to the next cycle that has not closed yet.
  const activeIdx = React.useMemo(() => {
    const idx = cycles.findIndex(c => aoeTimeLeft(c.deadline) > 0);
    return idx >= 0 ? idx : 0;
  }, [cycles]);

  const collapsible = cycles.length > 2;
  const shown = collapsible && !expanded ? [cycles[activeIdx]] : cycles;

  const when = main.parsed_date ? formatDate(main.parsed_date) : (main.date ? String(main.date) : '');
  const rate = main.acceptance_rate ? `${(Math.round(main.acceptance_rate * 100) / 100).toFixed(2)}%` : null;
  const note = multi && main.note?.toLowerCase().includes('cycle') ? null : main.note;

  // Everything secondary reads as one quiet line rather than a row of chips.
  const extras = [
    when && main.place ? `${when} · ${main.place}` : (when || main.place),
    main.program_chair && `Chair: ${main.program_chair}`,
    rate && `Acceptance: ${rate}`,
    note && `Note: ${note}`,
  ].filter(Boolean);

  return (
    <article className="card">
      <div className="card-main">
        <h3 className="card-title">
          <a href={main.link} target="_blank" rel="noopener noreferrer">
            {main.name} {main.year}
          </a>
          {main.estimated && (
            <span className="card-estimated" title="Projected from last year's timeline — confirm on the conference site">
              estimated
            </span>
          )}
        </h3>

        {main.description && <p className="card-desc">{main.description}</p>}

        {extras.map((line, i) => <p className="card-extra" key={i}>{line}</p>)}
      </div>

      <div className="card-side">
        {shown.map((c, i) => <Cycle key={i} cycle={c} showLabel={multi} />)}

        {collapsible && (
          <button type="button" className="card-more" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Show less' : `All ${cycles.length} cycles`}
          </button>
        )}
      </div>
    </article>
  );
};

export default ConferenceCard;
