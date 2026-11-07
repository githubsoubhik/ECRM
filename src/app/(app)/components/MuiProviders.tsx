'use client';

import type { ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';

const theme = createTheme({
  palette: {
    primary: { main: '#12372F', dark: '#0B2620', contrastText: '#FFFFFF' },
    error: { main: '#E0364F' },
    text: { primary: '#161C3A', secondary: '#5B6280' },
    divider: '#E7E9F0',
    background: { default: '#FFFFFF', paper: '#FFFFFF' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--font-inter), Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiSelect: {
      defaultProps: { IconComponent: KeyboardArrowDownRounded },
      styleOverrides: {
        select: { display: 'flex', alignItems: 'center', minHeight: 'unset' },
        icon: { color: '#161C3A' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          fontSize: 14,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E3E6EE' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#C6CBDA' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#12372F', borderWidth: 1.5 },
        },
        input: { padding: '10px 14px' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 14,
          '&.Mui-selected': { backgroundColor: '#EAF3EF' },
          '&.Mui-selected:hover': { backgroundColor: '#DCEBE4' },
        },
      },
    },
    MuiListSubheader: {
      styleOverrides: { root: { fontSize: 12, fontWeight: 600, lineHeight: '32px', color: '#5B6280' } },
    },
  },
});

export default function MuiProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>{children}</LocalizationProvider>
    </ThemeProvider>
  );
}
