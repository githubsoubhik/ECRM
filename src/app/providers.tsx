'use client';

import * as React from 'react';
import {
  ThemeProvider,
  createTheme,
  THEME_ID,
} from '@mui/material/styles';
import { CssVarsProvider } from '@mui/joy/styles';

const materialTheme = createTheme();

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={{ [THEME_ID]: materialTheme }}>
      <CssVarsProvider>
        {children}
      </CssVarsProvider>
    </ThemeProvider>
  );
}