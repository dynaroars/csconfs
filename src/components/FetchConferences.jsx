import { parseConferenceDate } from '../utils/dateParser';

/**
 * Formats a Date object as YYYY-MM-DD string in local time.
 * @param {Date} date
 * @returns {string}
 */
function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Expands a conference with rolling deadlines into multiple entries.
 * For conferences like VLDB that have monthly submission deadlines.
 *
 * @param {Object} conf - Conference object with rolling_deadline field
 * @returns {Array} Array of conference objects with individual deadlines
 */
function expandRollingDeadlines(conf) {
  if (!conf.rolling_deadline) return [conf];

  const { submission_day, notification_day, notification_month_offset, start, end } = conf.rolling_deadline;
  const deadlines = [];

  let current = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  let cycleNum = 1;

  while (current <= endDate) {
    const notification = new Date(current);
    notification.setMonth(notification.getMonth() + notification_month_offset);
    notification.setDate(notification_day);

    deadlines.push({
      ...conf,
      deadline: formatDateLocal(current),
      notification_date: formatDateLocal(notification),
      note: `Cycle ${cycleNum}`,
      rolling_deadline: undefined,
    });

    current.setMonth(current.getMonth() + 1);
    current.setDate(submission_day);
    cycleNum++;
  }

  return deadlines;
}

/** Fetches one of the JSON files generated from public/data by scripts/build-data.js. */
async function getJSON(name) {
  const response = await fetch(`/csconfs/data/${name}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${name}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchFullData() {
  try {
    const [loadedConferences, csrankingsData, coreData, conferenceStat] = await Promise.all([
      getJSON('conferences.json'),
      getJSON('csrankings.json'),
      getJSON('core.json'),
      getJSON('acceptance_rates.json'),
    ]);

    loadedConferences.forEach(conf => {
      let conferenceName = `${conf.name}-${conf.year}`;
      if (conferenceName in conferenceStat) {
        // Only fill in stats the YAML does not already specify
        if (!conf.acceptance_rate || conf.acceptance_rate.toString().trim() === '') {
          conf.acceptance_rate = (conferenceStat[conferenceName].acceptanceRate * 100).toFixed(2);
        }
        if (!conf.num_submission || conf.num_submission.toString().trim() === '') {
          conf.num_submission = conferenceStat[conferenceName].submission;
        }
      }
      
      // Attach the mathematically parsed date object for downstream sorting/filtering
      conf.parsed_date = parseConferenceDate(conf.date, conf.year);
    });

    // Expand rolling deadlines (e.g., VLDB monthly submissions)
    const expandedConferences = loadedConferences.flatMap(expandRollingDeadlines);

    return {
      loadedConferences: expandedConferences,
      csrankingsData,
      coreData,
    };
  } catch (err) {
    console.error('Error loading conferences:', err);
    throw err;
  }
}