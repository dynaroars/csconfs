import yaml from 'js-yaml';
import Papa from 'papaparse';

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
        conf.acceptance_rate = conferenceStat[conferenceName].acceptanceRate;
      }
    })
  
    return {
      loadedConferences,
      csrankingsData,
      coreData,
    };
  } catch (err) {
    console.error('Error loading conferences:', err);
    throw err;
  }
}