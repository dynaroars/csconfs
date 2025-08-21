import React from 'react';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';

export default function Header() {
  return (
    <header style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
      <div>
        <div>
          <Link 
            href="https://roars.dev/csconfs"
            target="_blank" 
            rel="noopener noreferrer" 
            underline="none"
            aria-label="CSConfs project homepage"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              sx={{
                margin: 0,
                fontWeight: '900',
                letterSpacing: 2,
                background: 'rgb(117, 177, 109)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '1px 1px 4px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                userSelect: 'none',
                fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
                '@media (max-width:600px)': {
                  fontSize: '1rem',
                  letterSpacing: 1,
                },
              }}
            >
              CSConfs: CS Conference Deadlines 
            </Typography>
          </Link>
        </div>
        <div>
          <Typography
            variant="body2"
            component="div"
            sx={{ 
              marginTop: 1, 
              color: 'text.secondary', 
              userSelect: 'text',
              '@media (max-width:600px)': {
                fontSize: '0.6rem',
              },
            }}
          >
            Countdown to submission deadlines uses AoE (Anywhere on Earth) time zone.<br />
            Src, contributions, issues:{' '}
            <Link 
              href="https://code.roars.dev/csconfs"
              target="_blank" 
              rel="noopener noreferrer" 
              underline="hover"
              aria-label="Code repository for CSConfs"
            >
              code.roars.dev/csconfs
            </Link>.
          </Typography>
        </div>
      </div>
    </header>
  );
}
