import React from 'react';

const parentAreaColors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#9467bd', '#d62728',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

// Simple animated collapse using max-height trick
function Collapse({ open, children }) {
  return (
    <div style={{
      overflow: 'hidden',
      maxHeight: open ? '99999px' : '0',
      transition: 'max-height 0.25s ease',
    }}>
      {children}
    </div>
  );
}

// Native chevron icon
function Chevron({ open, color }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12"
      fill="none" stroke={color || 'currentColor'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{
        flexShrink: 0,
        transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
        transition: 'transform 0.2s ease',
      }}
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

// Tri-state checkbox (checked / indeterminate / unchecked)
function TriCheckbox({ checked, indeterminate, onChange, label }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{
        cursor: 'pointer',
        accentColor: 'var(--primary-color)',
        flexShrink: 0,
        marginRight: '4px',
      }}
      aria-label={label}
    />
  );
}

export default function Sidebar(props) {
  const {
    datasets, selectedConferences,
    openTopLevel, setOpenTopLevel,
    openParents, openAreas,
    toggleParent, toggleArea,
    handleCheckboxChange, isAllSelected, isSomeSelected,
    toggleMultipleConferences,
    getConferencesByParentArea, getConferencesByAreaTitle,
  } = props;

  return (
    <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
      {['csrankings', 'core'].map(datasetId => {
        const title = datasetId === 'csrankings' ? 'CSRankings' : 'CORE';
        const { areas, conferencesByArea } = datasets[datasetId];

        const allDatasetConfs = Object.keys(areas).flatMap(p =>
          getConferencesByParentArea(datasetId, p)
        );
        const allSel  = isAllSelected(allDatasetConfs);
        const someSel = isSomeSelected(allDatasetConfs);
        const topOpen = openTopLevel[datasetId];

        return (
          <li key={datasetId} style={{ marginBottom: '4px' }}>
            {/* Dataset row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <TriCheckbox
                checked={allSel}
                indeterminate={someSel}
                onChange={e => toggleMultipleConferences(allDatasetConfs, e.target.checked)}
                label={`Select all under ${title}`}
              />
              <button
                className="sidebar-btn"
                onClick={() => setOpenTopLevel(p => ({ ...p, [datasetId]: !p[datasetId] }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '6px 8px', borderRadius: '6px',
                  fontFamily: 'var(--font-heading)', fontWeight: 800,
                  fontSize: 'var(--text-lg)', color: 'var(--text-primary)',
                  width: '100%', textAlign: 'left',
                }}
                aria-expanded={topOpen}
                aria-label={`${topOpen ? 'Collapse' : 'Expand'} ${title}`}
              >
                <Chevron open={topOpen} />
                {title}
              </button>
            </div>

            <Collapse open={topOpen}>
              <ul style={{ listStyle: 'none', paddingLeft: '16px', margin: 0 }}>
                {Object.entries(areas).map(([parentArea, areaDetails], pIdx) => {
                  const parentConfs = getConferencesByParentArea(datasetId, parentArea);
                  const color       = parentAreaColors[pIdx % parentAreaColors.length];
                  const parentKey   = `${datasetId}:${parentArea}`;
                  const parentOpen  = !!openParents[parentKey];

                  return (
                    <li key={parentArea} style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <TriCheckbox
                          checked={isAllSelected(parentConfs)}
                          indeterminate={isSomeSelected(parentConfs)}
                          onChange={e => toggleMultipleConferences(parentConfs, e.target.checked)}
                          label={`Select all under ${parentArea}`}
                        />
                        <button
                          className="sidebar-btn"
                          onClick={() => toggleParent(datasetId, parentArea)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '6px 8px', borderRadius: '6px',
                            fontFamily: 'var(--font-body)', fontWeight: 700,
                            fontSize: 'var(--text-base)', color,
                            width: '100%', textAlign: 'left',
                          }}
                          aria-expanded={parentOpen}
                        >
                          <Chevron open={parentOpen} color={color} />
                          {parentArea}
                        </button>
                      </div>

                      <Collapse open={parentOpen}>
                        <ul style={{ listStyle: 'none', paddingLeft: '16px', margin: 0 }}>
                          {areaDetails.map(({ area_title }) => {
                            const areaConfs = getConferencesByAreaTitle(datasetId, area_title);
                            const areaKey   = `${datasetId}:${area_title}`;
                            const areaOpen  = !!openAreas[areaKey];

                            return (
                              <li key={area_title} style={{ marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <TriCheckbox
                                    checked={isAllSelected(areaConfs)}
                                    indeterminate={isSomeSelected(areaConfs)}
                                    onChange={e => toggleMultipleConferences(areaConfs, e.target.checked)}
                                    label={`Select all under ${area_title}`}
                                  />
                                  <button
                                    className="sidebar-btn"
                                    onClick={() => toggleArea(datasetId, area_title)}
                                    style={{
                                      display: 'flex', alignItems: 'center', gap: '6px',
                                      background: 'none', border: 'none', cursor: 'pointer',
                                      padding: '6px 8px', borderRadius: '6px',
                                      fontFamily: 'var(--font-body)', fontWeight: 600,
                                      fontSize: 'var(--text-sm)', color,
                                      width: '100%', textAlign: 'left',
                                    }}
                                    aria-expanded={areaOpen}
                                  >
                                    <Chevron open={areaOpen} color={color} />
                                    {area_title}
                                  </button>
                                </div>

                                <Collapse open={areaOpen}>
                                  <ul style={{ listStyle: 'none', paddingLeft: '16px', margin: 0 }}>
                                    {conferencesByArea[area_title]?.map(name => (
                                      <li key={name} style={{ marginBottom: '4px' }}>
                                        <label className="sidebar-btn" style={{
                                          display: 'flex', alignItems: 'center', gap: '8px',
                                          cursor: 'pointer',
                                          fontFamily: 'var(--font-body)',
                                          fontSize: 'var(--text-sm)',
                                          fontWeight: 500,
                                          color: 'var(--text-primary)',
                                          padding: '6px 8px',
                                          borderRadius: '6px',
                                        }}>
                                          <input
                                            type="checkbox"
                                            checked={selectedConferences.has(name)}
                                            onChange={() => handleCheckboxChange(name)}
                                            style={{ cursor: 'pointer', accentColor: color, flexShrink: 0 }}
                                            aria-label={`Select conference ${name}`}
                                          />
                                          {name}
                                        </label>
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