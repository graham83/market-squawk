import React from 'react';
import EconomicCalendar from './components/features/EconomicCalendar';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <ThemeProvider>
        <EconomicCalendar />
      </ThemeProvider>
      <SpeedInsights />
      <Analytics />
    </>
  );
}
