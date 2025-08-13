import React from 'react';
import EconomicCalendar from './components/features/EconomicCalendar';
import { ThemeProvider } from './hooks/useTheme.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <EconomicCalendar />
    </ThemeProvider>
  );
}
