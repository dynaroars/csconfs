import React, { useMemo, useRef, useState } from 'react';

import { rankMatches } from '../utils/search';

const GROUP_LIMITS = { conferences: 8, subfields: 8 };

/**
 * Main search bar with a grouped autocomplete dropdown (conferences and
 * subfields). Typing a subfield broadens the match to every conference under
 * it — App.jsx resolves that against the sidebar selection, so results still
 * respect whatever is checked there.
 */
export default function SearchBar({ value, onChange, conferenceOptions, subfieldOptions, placeholder }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimer = useRef(null);

  const query = value.trim().toLowerCase();

  const conferenceMatches = useMemo(
    () => (query ? rankMatches(conferenceOptions, query, GROUP_LIMITS.conferences, o => o.label) : []),
    [conferenceOptions, query]
  );
  const subfieldMatches = useMemo(
    () => (query ? rankMatches(subfieldOptions, query, GROUP_LIMITS.subfields, o => o.label) : []),
    [subfieldOptions, query]
  );

  const groups = [
    ['Conferences', conferenceMatches],
    ['Subfields', subfieldMatches],
  ].filter(([, items]) => items.length);
  const flatItems = groups.flatMap(([, items]) => items);
  const showListbox = open && query && flatItems.length > 0;

  const commit = label => {
    onChange(label);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!flatItems.length) return;
      setOpen(true);
      setActiveIndex(i => (i + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flatItems.length) return;
      setActiveIndex(i => (i - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        e.preventDefault();
        commit(flatItems[activeIndex].label);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="main-search">
      <input
        type="text"
        className="main-search-input"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={showListbox}
        aria-autocomplete="list"
        aria-controls="main-search-listbox"
      />
      {showListbox && (
        <div
          className="main-search-listbox"
          id="main-search-listbox"
          role="listbox"
          onMouseDown={e => e.preventDefault()}
        >
          {groups.map(([label, items]) => (
            <div key={label} className="main-search-group">
              <div className="main-search-group-label">{label}</div>
              {items.map(item => {
                const idx = flatItems.indexOf(item);
                return (
                  <button
                    type="button"
                    key={`${label}-${item.label}`}
                    className={`main-search-option${idx === activeIndex ? ' is-active' : ''}`}
                    role="option"
                    aria-selected={idx === activeIndex}
                    onClick={() => commit(item.label)}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <span>{item.label}</span>
                    {Number.isFinite(item.count) && <small>{item.count}</small>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
