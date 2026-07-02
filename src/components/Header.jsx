import React from 'react';

/**
 * Header – Phase 2
 * Matches CSPicks visual language: Outfit heading font, Inter body,
 * fixed circle theme toggle top-right, clean border-bottom.
 */
export default function Header({ toggleTheme, mode, onAddClick }) {
  const isDark = mode === 'dark';

  const handleToggle = (e) => {
    // Pass click origin so App can run View Transition from that point
    if (toggleTheme) toggleTheme(e);
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-color)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1.25rem 28px 1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <div style={{ flex: 1 }}>
          {/* Title */}
          <a
            href="https://roars.dev/csconfs"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="CSConfs project homepage"
            style={{ textDecoration: 'none' }}
          >
            <h1 style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 6vw, var(--text-2xl))',
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.15,
              userSelect: 'none',
            }}>
              <span style={{ color: '#2ca02c' }}>CSConfs:</span> CS Conference Deadlines
            </h1>
          </a>

          {/* Subtitle */}
          <p style={{
            marginTop: '0.375rem',
            marginBottom: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
            userSelect: 'text',
          }}>
            Countdown to submission deadlines uses AoE (Anywhere on Earth) time zone.{' '}
            Src, contributions, issues:{' '}
            <a
              href="https://code.roars.dev/csconfs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Code repository for CSConfs"
              style={{ color: 'var(--accent-color)', textDecoration: 'none' }}
              onMouseOver={e => e.target.style.textDecoration = 'underline'}
              onMouseOut={e => e.target.style.textDecoration = 'none'}
            >
              code.roars.dev/csconfs
            </a>.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              outline: 'none',
              height: '38px',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--text-primary)';
              e.currentTarget.style.color = 'var(--bg-color)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.background = 'var(--bg-color)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            <span>➕</span> Add Conference
          </button>

          {/* Theme toggle — aligned to the right edge of the 1400px container */}
          <button
            className="theme-toggle"
            onClick={handleToggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{ margin: 0 }}
          >
            <span className="sun-icon">☀️</span>
            <span className="moon-icon">🌙</span>
          </button>
        </div>
      </div>
    </header>
  );
}
