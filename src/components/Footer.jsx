import React from 'react';
import logo from '../assets/t-rex-2.gif';

export default function Footer() {
  return (
    <footer style={{
      marginTop: '2rem',
      padding: '1rem 1.5rem',
      textAlign: 'center',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-color)',
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
    }}>
      <a
        href="https://roars.dev"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ROARS website"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-sm)',
        }}
        onMouseOver={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <img src={logo} alt="ROARS dino logo" style={{ height: '40px' }} />
        ROARS © {new Date().getFullYear()}
      </a>
    </footer>
  );
}