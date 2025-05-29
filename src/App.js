import React, { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import ConferenceDisplay from './components/ConferenceDisplay';
import { fetchFullData } from './components/FetchConferences';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [conferences, setConferences] = useState([]);
  const [filteredConferences, setFilteredConferences] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // States for both datasets
  const [csrAreas, setCsrAreas] = useState({});
  const [csrConfsByArea, setCsrConfsByArea] = useState({});
  const [coreAreas, setCoreAreas] = useState({});
  const [coreConfsByArea, setCoreConfsByArea] = useState({});

  const [selectedConferences, setSelectedConferences] = useState(new Set());
  const [openTopLevel, setOpenTopLevel] = useState({ csrankings: true, core: true });
  // Store openParents and openAreas as objects with keys prefixed by datasetId, e.g. 'csrankings:KDD'
  const [openParents, setOpenParents] = useState({});
  const [openAreas, setOpenAreas] = useState({});

  const [hidePastDeadlines, setHidePastDeadlines] = useState(true);


  // Utility to get all CSRankings and CORE conference names (flatten)
  const allCsrConfNames = Object.values(csrConfsByArea).flat();
  const allCoreConfNames = Object.values(coreConfsByArea).flat();

  // Toggle parent accepts datasetId to uniquely key openParents state
  const toggleParent = (datasetId, parentArea) => {
    const key = `${datasetId}:${parentArea}`;
    setOpenParents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle area accepts datasetId to uniquely key openAreas state
  const toggleArea = (datasetId, areaTitle) => {
    const key = `${datasetId}:${areaTitle}`;
    setOpenAreas(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getConferencesByParentArea = (datasetId, parentArea) => {
    const areasObj = datasetId === 'csrankings' ? csrAreas : coreAreas;
    const confsByArea = datasetId === 'csrankings' ? csrConfsByArea : coreConfsByArea;
    let confs = [];
    const areaDetails = areasObj[parentArea] || [];
    areaDetails.forEach(({ area_title }) => {
      confs = confs.concat(confsByArea[area_title] || []);
    });
    return confs;
  };

  const getConferencesByAreaTitle = (datasetId, areaTitle) => {
    return (datasetId === 'csrankings' ? csrConfsByArea : coreConfsByArea)[areaTitle] || [];
  };

  // Check selected state helpers
  const isAllSelected = confList => confList.length > 0 && confList.every(c => selectedConferences.has(c));
  const isSomeSelected = confList => confList.some(c => selectedConferences.has(c)) && !isAllSelected(confList);

  const toggleMultipleConferences = (confList, select) => {
    const updatedSelected = new Set(selectedConferences);
    confList.forEach(confName => {
      if (select) updatedSelected.add(confName);
      else updatedSelected.delete(confName);
    });
    setSelectedConferences(updatedSelected);
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      const { loadedConferences, csrankingsData, coreData } = await fetchFullData();

      setCsrAreas(csrankingsData.areasMap);
      setCsrConfsByArea(csrankingsData.conferencesByArea);
      setCoreAreas(coreData.areasMap);
      setCoreConfsByArea(coreData.conferencesByArea);

      // Initialize all parents open
      const openParentsInit = {};
      Object.entries(csrankingsData.areasMap).forEach(([parentArea]) => {
        openParentsInit[`csrankings:${parentArea}`] = true;
      });
      Object.entries(coreData.areasMap).forEach(([parentArea]) => {
        openParentsInit[`core:${parentArea}`] = true;
      });

      // Parse URL params
      const parseParams = () => {
        // key as ranking criteria and value as list of conferences
        let res = {};

        let paramList = window.location.search.substring(1).split("&");

        // Map the paramList into an object with key as ranking criteria and value as list of conferences
        for (let param of paramList) {
          let tempSplit = param.split("=");
          const key = tempSplit[0], value = tempSplit[1];
          res[key] = value;
        }
        return res;
      }

      const params = parseParams();
      const csrParam = params['csrankings'];
      const coreParam = params['core'];
      const selectedFromUrl = new Set();

      if (csrParam === 'all') {
        csrankingsData.allConferenceNames.forEach(c => selectedFromUrl.add(c));
      } else if (csrParam) {
        csrParam.split(',').forEach(c => selectedFromUrl.add(c));
      }

      if (coreParam === 'all') {
        coreData.allConferenceNames.forEach(c => selectedFromUrl.add(c));
      } else if (coreParam) {
        coreParam.split(',').forEach(c => selectedFromUrl.add(c));
      }
      // If URL params present and at least one selected conf from URL, use them;
      // Otherwise default to select all confs
      if (selectedFromUrl.size > 0) {
        setSelectedConferences(selectedFromUrl);
      } else {
        // No selection in URL → select all by default
        const allConfs = [
          ...csrankingsData.allConferenceNames,
          // ...coreData.allConferenceNames,
        ];
        setSelectedConferences(new Set(allConfs));
      }

      setOpenParents(openParentsInit);
      setConferences(loadedConferences);
      setLoading(false);
    };
    loadData();
  }, []);


  // Update URL when selectedConferences changes
  useEffect(() => {
    if (conferences.length === 0) return;
    
    // Conferences overlapping in both datasets
    const confsInBoth = allCsrConfNames.filter(conf => allCoreConfNames.includes(conf));
  
    // Identify selected conferences for CSR and CORE
    const selectedCsr = allCsrConfNames.filter(conf => selectedConferences.has(conf));
    const selectedCore = allCoreConfNames.filter(conf => selectedConferences.has(conf));
  
    // Determine if all CSR and/or CORE conferences are selected
    const allCsrSelected = selectedCsr.length === allCsrConfNames.length;
    const allCoreSelected = selectedCore.length === allCoreConfNames.length;
  
    // Compose CSR param excluding any conferences also in CORE if CORE fully selected
    let csrParamList = selectedCsr;
    if (allCoreSelected) {
      // remove overlapping conferences from CSR
      csrParamList = csrParamList.filter(conf => !confsInBoth.includes(conf));
    }
  
    // Compose CORE param excluding any conferences also in CSR if CSR fully selected
    let coreParamList = selectedCore;
    if (allCsrSelected) {
      // remove overlapping conferences from CORE
      coreParamList = coreParamList.filter(conf => !confsInBoth.includes(conf));
    }
  
    let paramUrl = '';
    // Set csrankings param
    if (csrParamList.length === allCsrConfNames.length - (allCoreSelected ? confsInBoth.length : 0)) {
      paramUrl += 'csrankings=all';
    } else if (csrParamList.length > 0) {
      paramUrl += `csrankings=${csrParamList.join(',')}`;
    }
  
    // Set core param
    if (coreParamList.length === allCoreConfNames.length - (allCsrSelected ? confsInBoth.length : 0)) {
      paramUrl += '&core=all';
    } else if (coreParamList.length > 0) {
      paramUrl += `&core=${coreParamList.join(',')}`;
    }
    const newUrl = window.location.pathname + '?' + paramUrl;
    window.history.replaceState(null, '', newUrl);
    // eslint-disable-next-line
  }, [selectedConferences, allCsrConfNames, allCoreConfNames]);


  const filterConferences = () => {
    const selected = Array.from(selectedConferences);
    const now = new Date();
  
    const updatedConferences = conferences.filter(conf => {
      const matchesConference = selected.includes(conf.name);
      const matchesSearch = conf.name.toLowerCase().includes(searchQuery.toLowerCase());
  
      const deadlineDate = new Date(conf.deadline);
      const conferenceDate = new Date(conf.date);
      // Filter out past deadline conferences if hidePastDeadlines is true
      const isUpcoming = !hidePastDeadlines || deadlineDate >= now || conferenceDate >= now;
  
      return matchesConference && matchesSearch && isUpcoming;
    });
    
    setFilteredConferences(updatedConferences);
  };

  // Select conferences
  useEffect(() => {
    filterConferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConferences, searchQuery, conferences, hidePastDeadlines]);

  const handleCheckboxChange = conferenceName => {
    const updatedSelected = new Set(selectedConferences);
    if (updatedSelected.has(conferenceName)) {
      updatedSelected.delete(conferenceName);
    } else {
      updatedSelected.add(conferenceName);
    }
    setSelectedConferences(updatedSelected);
  };

  const handleSearchChange = event => {
    setSearchQuery(event.target.value);
  };

  return (
    <div>
      <Header />
      <div className="App">
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <h2>Loading...</h2>
          </div>
        ) : (
          <>
            <div className="conference-list">
              <ConferenceDisplay filteredConferences={filteredConferences} />
            </div>
            
            <div className="sidebar">
              <h2>Filters</h2>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hidePastDeadlines}
                    onChange={e => setHidePastDeadlines(e.target.checked)}
                    color="primary"
                  />
                }
                label="Hide past conferences"
              />
              <TextField
                label="Search by conference name"
                variant="outlined"
                name="search"
                value={searchQuery}
                onChange={handleSearchChange}
                style={{ marginBottom: '20px', width: '100%', fontSize: '1.0rem' }}
                fullWidth
              />
              <Sidebar
                datasets={{
                  csrankings: { areas: csrAreas, conferencesByArea: csrConfsByArea },
                  core: { areas: coreAreas, conferencesByArea: coreConfsByArea },
                }}
                selectedConferences={selectedConferences}
                openTopLevel={openTopLevel}
                setOpenTopLevel={setOpenTopLevel}
                openParents={openParents}
                setOpenParents={setOpenParents}
                openAreas={openAreas}
                setOpenAreas={setOpenAreas}
                toggleMultipleConferences={toggleMultipleConferences}
                handleCheckboxChange={handleCheckboxChange}
                getConferencesByParentArea={getConferencesByParentArea}
                getConferencesByAreaTitle={getConferencesByAreaTitle}
                isAllSelected={isAllSelected}
                isSomeSelected={isSomeSelected}
                toggleParent={toggleParent}
                toggleArea={toggleArea}
              />
            </div>

          </>
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;