import '../styles/globals.css';
import { ThemeProvider } from '../hooks/useTheme.jsx';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
      <SpeedInsights />
      <Analytics />
    </>
  );
}