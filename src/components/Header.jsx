import React from 'react';

const THEME_LABELS = {
  auto: { icon: '🌗', title: 'Theme: auto (following your system) — click for light' },
  light: { icon: '☀️', title: 'Theme: light — click for dark' },
  dark: { icon: '🌙', title: 'Theme: dark — click to follow your system' },
};

export default function Header({ toggleTheme, themePref, onAddClick }) {
  const theme = THEME_LABELS[themePref] || THEME_LABELS.auto;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div>
          <div className="title-row">
            <a
              className="site-title-link"
              href="https://roars.dev/csconfs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="CSConfs project homepage"
            >
              <h1 className="site-title">
                <span className="site-title-mark">CSConfs:</span> CS Conference Deadlines
              </h1>
            </a>

            <a
              className="icon-link github-link"
              href="https://github.com/dynaroars/csconfs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View CSConfs source on GitHub"
              title="View source on GitHub"
            />
            <a
              className="icon-link"
              href="https://github.com/dynaroars/csconfs/blob/main/FAQ.md"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="FAQ, data sources and how to report a correction"
              title="FAQ &amp; data sources"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.2 9.3a2.9 2.9 0 0 1 5.6 1c0 2-2.8 2.4-2.8 4.2" />
                <circle cx="12" cy="17.6" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a
              className="icon-link roars-link"
              href="https://roars.dev"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="ROARS Lab"
              title="ROARS Lab"
            />
          </div>

          <p className="site-subtitle">
            Countdown to submission deadlines uses AoE (Anywhere on Earth) time zone.{' '}
            Src, contributions, issues:{' '}
            <a href="https://code.roars.dev/csconfs" target="_blank" rel="noopener noreferrer">code.roars.dev/csconfs</a>.{' '}
            <a href="https://github.com/dynaroars/csconfs/blob/main/FAQ.md" target="_blank" rel="noopener noreferrer">FAQ &amp; data sources</a>.
          </p>
        </div>

        <div className="header-actions">
          <button type="button" className="btn" onClick={onAddClick}>
            + Add Conference
          </button>

          {/* Cycles auto → light → dark */}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme.title}
            title={theme.title}
          >
            <span aria-hidden="true">{theme.icon}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
