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
            <Link 
              href="https://roars.dev" 
              target="_blank" 
              rel="noopener noreferrer" 
              underline="hover"
              aria-label="Roars Lab, Computer Science, George Mason University"
            >
              Roars Lab
            </Link> @ George Mason University.<br />
            Countdown to submission deadlines uses AoE (Anywhere on Earth) time zone.<br />
            See something missing or inaccurate? Create a GitHub issue or a pull request at{' '}
            <Link 
              href="https://git.roars.dev/csconfs" 
              target="_blank" 
              rel="noopener noreferrer" 
              underline="hover"
              aria-label="Git repository for CSConfs"
            >
              git.roars.dev/csconfs
            </Link>.
          </Typography>
        </div>
      </div>
    </header>
  );
}