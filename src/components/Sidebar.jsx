import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import FormControlLabel from '@mui/material/FormControlLabel';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const parentAreaColors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#9467bd', '#d62728', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

export default function Sidebar(props) {
  const {
    datasets,
    selectedConferences,
    openTopLevel,
    setOpenTopLevel,
    openParents,
    openAreas,
    toggleParent,
    toggleArea,
    handleCheckboxChange,
    isAllSelected,
    isSomeSelected,
    toggleMultipleConferences,
    getConferencesByParentArea,
    getConferencesByAreaTitle,
  } = props;

  return (
    <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
      {['csrankings', 'core'].map(datasetId => {
        const title = datasetId === 'csrankings' ? 'CSRankings' : 'CORE';
        const { areas, conferencesByArea } = datasets[datasetId];

        // Gather all conferences under this dataset
        const allDatasetConfs = Object.keys(areas).flatMap(parentArea =>
          getConferencesByParentArea(datasetId, parentArea)
        );

        // Checkbox checked state for top-level
        const allSelected = isAllSelected(allDatasetConfs);
        const someSelected = isSomeSelected(allDatasetConfs);

        return (
          <li key={datasetId} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                indeterminate={someSelected}
                checked={allSelected}
                onChange={(e) => toggleMultipleConferences(allDatasetConfs, e.target.checked)}
                color="primary"
                size="small"
                style={{ padding: 0, marginRight: 0 }}
                inputProps={{ 'aria-label': `Select all conferences under ${title}` }}
              />
              <IconButton
                size="small"
                onClick={() =>
                  setOpenTopLevel(prev => ({
                    ...prev,
                    [datasetId]: !prev[datasetId],
                  }))
                }
                aria-label={`${openTopLevel[datasetId] ? 'Collapse' : 'Expand'} ${title}`}
              >
                {openTopLevel[datasetId] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
              <strong
                style={{ fontSize: '1.2rem', cursor: 'pointer', userSelect: 'none' }}
                onClick={() =>
                  setOpenTopLevel(prev => ({
                    ...prev,
                    [datasetId]: !prev[datasetId],
                  }))
                }
              >
                {title}
              </strong>
            </div>

            <Collapse in={openTopLevel[datasetId]} timeout="auto" unmountOnExit>
              <ul style={{ listStyle: 'none', paddingLeft: 18, margin: 0 }}>
                {Object.entries(areas).map(([parentArea, areaDetails], parentIndex) => {
                  const parentConfs = getConferencesByParentArea(datasetId, parentArea);
                  const parentColor = parentAreaColors[parentIndex % parentAreaColors.length];
                  const parentKey = `${datasetId}:${parentArea}`;
                  const parentOpen = !!openParents[parentKey];

                  return (
                    <li key={parentArea} style={{ marginBottom: 0, color: parentColor }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          indeterminate={isSomeSelected(parentConfs)}
                          checked={isAllSelected(parentConfs)}
                          onChange={e => toggleMultipleConferences(parentConfs, e.target.checked)}
                          color="primary"
                          size="small"
                          style={{ padding: 0, marginRight: 0 }}
                          inputProps={{ 'aria-label': `Select all conferences under parent area ${parentArea}` }}
                        />
                        <div
                          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}
                          onClick={() => toggleParent(datasetId, parentArea)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') toggleParent(datasetId, parentArea);
                          }}
                          aria-expanded={parentOpen}
                          aria-controls={`${datasetId}-${parentArea}-areas`}
                        >
                          <IconButton
                            size="small"
                            sx={{ color: parentColor }}
                            edge="start"
                            aria-label={`${parentOpen ? 'Collapse' : 'Expand'} parent area ${parentArea}`}
                            tabIndex={-1}
                          >
                            {parentOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          <strong>{parentArea}</strong>
                        </div>
                      </div>

                      <Collapse in={parentOpen} timeout="auto" unmountOnExit>
                        <ul
                          id={`${datasetId}-${parentArea}-areas`}
                          style={{ listStyle: 'none', paddingLeft: 18, margin: 0 }}
                        >
                          {areaDetails.map(({ area_title }) => {
                            const areaConfs = getConferencesByAreaTitle(datasetId, area_title);
                            const areaKey = `${datasetId}:${area_title}`;
                            const areaOpen = !!openAreas[areaKey];

                            return (
                              <li key={area_title} style={{ marginBottom: 0, color: parentColor }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <Checkbox
                                    indeterminate={isSomeSelected(areaConfs)}
                                    checked={isAllSelected(areaConfs)}
                                    onChange={e => toggleMultipleConferences(areaConfs, e.target.checked)}
                                    color="primary"
                                    size="small"
                                    style={{ padding: 0, marginRight: 4 }}
                                    inputProps={{ 'aria-label': `Select all conferences under area ${area_title}` }}
                                  />
                                  <div
                                    style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}
                                    onClick={() => toggleArea(datasetId, area_title)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter' || e.key === ' ') toggleArea(datasetId, area_title);
                                    }}
                                    aria-expanded={areaOpen}
                                    aria-controls={`${datasetId}-${area_title}-confs`}
                                  >
                                    <IconButton
                                      size="small"
                                      sx={{ color: parentColor }}
                                      edge="start"
                                      aria-label={`${areaOpen ? 'Collapse' : 'Expand'} area ${area_title}`}
                                      tabIndex={-1}
                                    >
                                      {areaOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                    <strong>{area_title}</strong>
                                  </div>
                                </div>

                                <Collapse in={areaOpen} timeout="auto" unmountOnExit>
                                  <ul
                                    id={`${datasetId}-${area_title}-confs`}
                                    style={{ listStyle: 'none', paddingLeft: 18, margin: 0 }}
                                  >
                                    {conferencesByArea[area_title]?.map(conferenceName => (
                                      <li key={conferenceName} style={{ color: parentColor }}>
                                        <FormControlLabel
                                          control={
                                            <Checkbox
                                              checked={selectedConferences.has(conferenceName)}
                                              onChange={() => handleCheckboxChange(conferenceName)}
                                              color="primary"
                                              size="small"
                                              inputProps={{
                                                'aria-label': `Select conference ${conferenceName}`,
                                              }}
                                            />
                                          }
                                          label={conferenceName}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                </Collapse>
                              </li>
                            );
                          })}
                        </ul>
                      </Collapse>
                    </li>
                  );
                })}
              </ul>
            </Collapse>
          </li>
        );
      })}
    </ul>
  );
}