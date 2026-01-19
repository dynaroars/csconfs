import React from 'react';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import logo from '../assets/t-rex-2.gif';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        marginTop: 4,
        padding: 2,
        textAlign: 'center',
        borderTop: '1px solid #ddd',
        color: 'text.secondary',
        fontSize: '1rem',
        '@media (max-width:600px)': {
          fontSize: '0.8rem',
        },
      }}
    >
      <a 
        href="https://roars.dev" 
        target="_blank" 
        rel="noopener noreferrer" 
        aria-label="ROARS website"
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          textDecoration: 'none', 
          color: 'inherit' 
        }}
      >
        <img 
          src={logo} 
          alt="dino logo" 
          style={{ height: '60px', marginRight: '10px' }} 
        />
        <Typography variant="body2" component="span">
          ROARS © {new Date().getFullYear()}.
        </Typography>
      </a>
    </Box>
  );
}