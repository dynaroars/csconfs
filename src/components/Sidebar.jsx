import React from 'react';

const parentAreaColors = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#9467bd', '#d62728',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

function Chevron({ open }) {
  return (
    <svg
      className={`tree-chevron${open ? ' is-open' : ''}`}
      width="12" height="12" viewBox="0 0 12 12"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  );
}

/** Checkbox with a third, indeterminate state for partial selections. */
function TriCheckbox({ checked, indeterminate, onChange, label, color }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate && !checked;
  }, [indeterminate, checked]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="tree-checkbox"
      checked={checked}
      onChange={onChange}
      style={color ? { accentColor: color } : undefined}
      aria-label={label}
    />
  );
}

/**
 * One expandable row of the filter tree. All three levels (dataset, parent
 * area, area) are the same shape and differ only by the `level` class.
 */
function TreeRow({ level, color, label, open, onToggle, confs, isAllSelected, isSomeSelected, toggleMultipleConferences, children }) {
  return (
    <li className="tree-item">
      <div className="tree-row">
        <TriCheckbox
          checked={isAllSelected(confs)}
          indeterminate={isSomeSelected(confs)}
          onChange={e => toggleMultipleConferences(confs, e.target.checked)}
          label={`Select all under ${label}`}
          color={color}
        />
        <button
          type="button"
          className={`tree-toggle tree-toggle--${level}`}
          style={color ? { color } : undefined}
          onClick={onToggle}
          aria-expanded={open}
        >
          <Chevron open={open} />
          {label}
        </button>
      </div>
      {open && <ul className="tree">{children}</ul>}
    </li>
  );
}

export default function Sidebar({
  datasets, selectedConferences,
  openTopLevel, setOpenTopLevel,
  openParents, openAreas,
  toggleParent, toggleArea,
  handleCheckboxChange, isAllSelected, isSomeSelected,
  toggleMultipleConferences,
  getConferencesByParentArea, getConferencesByAreaTitle,
}) {
  const shared = { isAllSelected, isSomeSelected, toggleMultipleConferences };

  return (
    <ul className="tree tree--root">
      {['csrankings', 'core'].map(datasetId => {
        const title = datasetId === 'csrankings' ? 'CSRankings' : 'CORE';
        const { areas, conferencesByArea } = datasets[datasetId];
        const allDatasetConfs = Object.keys(areas).flatMap(p => getConferencesByParentArea(datasetId, p));

        return (
          <TreeRow
            key={datasetId}
            level="dataset"
            label={title}
            confs={allDatasetConfs}
            open={openTopLevel[datasetId]}
            onToggle={() => setOpenTopLevel(p => ({ ...p, [datasetId]: !p[datasetId] }))}
            {...shared}
          >
            {Object.entries(areas).map(([parentArea, areaDetails], pIdx) => {
              const color = parentAreaColors[pIdx % parentAreaColors.length];

              return (
                <TreeRow
                  key={parentArea}
                  level="parent"
                  color={color}
                  label={parentArea}
                  confs={getConferencesByParentArea(datasetId, parentArea)}
                  open={!!openParents[`${datasetId}:${parentArea}`]}
                  onToggle={() => toggleParent(datasetId, parentArea)}
                  {...shared}
                >
                  {areaDetails.map(({ area_title }) => (
                    <TreeRow
                      key={area_title}
                      level="area"
                      color={color}
                      label={area_title}
                      confs={getConferencesByAreaTitle(datasetId, area_title)}
                      open={!!openAreas[`${datasetId}:${area_title}`]}
                      onToggle={() => toggleArea(datasetId, area_title)}
                      {...shared}
                    >
                      {conferencesByArea[area_title]?.map(name => (
                        <li key={name} className="tree-item">
                          <label className="tree-leaf">
                            <input
                              type="checkbox"
                              className="tree-checkbox"
                              checked={selectedConferences.has(name)}
                              onChange={() => handleCheckboxChange(name)}
                              style={{ accentColor: color }}
                              aria-label={`Select conference ${name}`}
                            />
                            {name}
                          </label>
                        </li>
                      ))}
                    </TreeRow>
                  ))}
                </TreeRow>
              );
            })}
          </TreeRow>
        );
      })}
    </ul>
  );
}
