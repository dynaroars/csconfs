import yaml from 'js-yaml';
import Papa from 'papaparse';

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

async function parseCSV(url) {
  const response = await fetch(url);
  const text = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      complete: (results) => {
        const areasMap = {};
        const conferencesMap = {};
        const nextTierFlags = {}; // confName -> boolean false if NextTier='False', true otherwise

        results.data.forEach(row => {
          const areaTitle = row.AreaTitle;
          const parentArea = row.ParentArea;

          const confName = row.ConferenceTitle;
          const isNextTier = row.NextTier && row.NextTier.toLowerCase() === 'true';
          nextTierFlags[confName] = isNextTier;

          if (!areasMap[parentArea]) {
            areasMap[parentArea] = [];
          }
          if (!areasMap[parentArea].some(area => area.area_title === areaTitle && area.year === row.year && area.note === row.note)) {
            areasMap[parentArea].push({
              area: row.Area,
              area_title: areaTitle,
              year: row.year,
              note: row.note,
            });
          }

          if (!conferencesMap[areaTitle]) {
            conferencesMap[areaTitle] = new Set();
          }
          conferencesMap[areaTitle].add(row.ConferenceTitle);
        });

        const finalConferencesByArea = {};
        Object.keys(conferencesMap).forEach(areaTitle => {
          finalConferencesByArea[areaTitle] = Array.from(conferencesMap[areaTitle]);
        });

        resolve({
          areasMap,
          conferencesByArea: finalConferencesByArea,
          allConferenceNames: Object.values(conferencesMap).flatMap(set => Array.from(set)),
          nextTierFlags,
        });
      },
      error: (err) => reject(err)
    });
  });
}

/**
 * 
 * @param {string} url
 * @returns an object with key as conference name and values of acceptances and submissions
 */
async function parseAcceptanceRateFile(url) {
  const response = await fetch(url);
  const text = await response.text();
  let conferences = Papa.parse(text, {
    header: true,
    skipEmptyLines: true
  }).data;

  let conferenceStat = {};

  // Read the file and count the total submission and acceptance for each conference
  for (let conf of conferences) {
    const conferenceName = `${conf.Conference}-${conf.Year}`;
    const acceptance = Number(conf.Accepted);
    const submission = Number(conf.Submitted);
    if (!(conferenceName in conferenceStat)) {
      conferenceStat[conferenceName] = {
        acceptance: 0,
        submission: 0
      }
    }
    conferenceStat[conferenceName].acceptance += acceptance;
    conferenceStat[conferenceName].submission += submission;
  }

  //Calculate the acceptance rate
  for (let conferenceName in conferenceStat) {
    let acceptance = conferenceStat[conferenceName].acceptance;
    let submission = conferenceStat[conferenceName].submission;
    conferenceStat[conferenceName].acceptanceRate = acceptance / submission;
  }
  return conferenceStat;
}

export async function fetchFullData() {
  try {
    const yamlResponse = await fetch('/csconfs/data/conferences.yaml');
    const yamlText = await yamlResponse.text();
    const loadedConferences = yaml.load(yamlText) || [];

    const csrankingsData = await parseCSV('/csconfs/data/csrankings_conferences.csv');
    const coreData = await parseCSV('/csconfs/data/core_conferences.csv');
    const conferenceStat = await parseAcceptanceRateFile('https://raw.githubusercontent.com/emeryberger/csconferences/refs/heads/main/csconferences.csv') || {};

    loadedConferences.forEach(conf => {
      let conferenceName = `${conf.name}-${conf.year}`;
      if (conferenceName in conferenceStat) {
        // Only add CSV data if not already present in YAML
        if (!conf.acceptance_rate || conf.acceptance_rate.toString().trim() === '') {
          conf.acceptance_rate = (conferenceStat[conferenceName].acceptanceRate * 100).toFixed(2);
        }
        if (!conf.num_submission || conf.num_submission.toString().trim() === '') {
          conf.num_submission = conferenceStat[conferenceName].submission;
        }
      }
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