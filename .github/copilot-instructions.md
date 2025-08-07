# Market Squawk - Economic Calendar

Market Squawk is a modern, responsive Economic Calendar web application built with React 18+ and Material Tailwind, designed for tracking economic events, market indicators, and financial calendar data.

**CRITICAL**: Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap, Build, and Test Repository
- Install dependencies: `npm install` -- takes 50-60 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
  - NOTE: Currently has 2 vulnerabilities (1 moderate, 1 high) but build/tests work fine
- Build for production: `npm run build` -- takes 5-6 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Run all tests: `npm run test:run` -- takes 7-8 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
- Test with coverage: `npm run test:coverage` -- takes 8-9 seconds. NEVER CANCEL. Set timeout to 60+ seconds.

### Development Server
- Start development server: `npm run dev`
  - Runs on http://localhost:5173/
  - Hot reloading enabled via Vite
  - Connects immediately (1-2 seconds)
- Preview production build: `npm run preview`
  - Runs on http://localhost:4173/market-squawk/
  - Serves the built application

### Deploy to GitHub Pages
- Automatic deployment via GitHub Actions on push to main
- Manual deployment: `npm run deploy` (builds and deploys via gh-pages)

## Validation

### ALWAYS Validate Changes with Complete User Scenarios
After making any code changes, you MUST test the application by:

1. **Start the dev server**: `npm run dev`
2. **Navigate to**: http://localhost:5173/
3. **Test core functionality**:
   - Verify the Economic Calendar loads with data (should show 70 events from mock data)
   - Test time period dropdown: click and select different options (Today, Tomorrow, This Week, etc.)
   - Test importance filter dropdown: click and select different levels (All, Low, Medium, High)
   - Test timezone selector: click and verify timezone options display
   - Test pagination: click page numbers to navigate between results
   - Test rows per page: click 10, 100, 1000 buttons to change display count
4. **Take a screenshot** to document the working application
5. **Verify no console errors** in browser developer tools

### Testing Requirements
- ALL 137 tests must pass: `npm run test:run`
- Coverage should maintain current levels: `npm run test:coverage`
- Application must load and display economic events correctly
- All interactive elements (dropdowns, pagination, filters) must be functional

### CI Requirements
- Tests run automatically in GitHub Actions before deployment
- Build must succeed: `npm run build`
- No additional linting tools are configured (no ESLint/Prettier in this repo)

## Tech Stack & Architecture

### Core Technologies
- **Frontend**: React 18+ with functional components and hooks
- **Styling**: Material Tailwind + Tailwind CSS
- **Build Tool**: Vite 5.x (fast builds and hot reloading)
- **Testing**: Vitest with jsdom environment
- **Deployment**: GitHub Pages via GitHub Actions

### Key Dependencies
- `@material-tailwind/react`: UI component library
- `axios`: HTTP client for API calls (though currently using mock data)
- `vitest`: Testing framework
- `@testing-library/react`: React testing utilities

## Codebase Navigation

### Project Structure
```
├── src/
│   ├── components/
│   │   ├── features/        # Feature-specific components
│   │   │   ├── EconomicCalendar.jsx      # Main calendar component
│   │   │   ├── NextEventTypewriter.jsx   # Event countdown display
│   │   │   └── __tests__/               # Feature component tests
│   │   └── ui/              # Reusable UI components
│   │       ├── ImportanceSelector.jsx   # Importance filter dropdown
│   │       ├── TimezoneSelector.jsx     # Timezone selector dropdown
│   │       └── __tests__/              # UI component tests
│   ├── hooks/               # Custom React hooks
│   │   ├── useEvents.js     # Event data management
│   │   ├── useImportance.js # Importance filter logic
│   │   └── useTimezone.js   # Timezone management
│   ├── utils/               # Utility functions
│   │   ├── dateRangeUtils.js    # Date filtering logic
│   │   ├── importanceUtils.js   # Importance level utilities
│   │   ├── soundUtils.js        # Audio notifications
│   │   ├── timezoneUtils.js     # Timezone conversion utilities
│   │   └── __tests__/          # Utility function tests
│   ├── services/            # API and data services
│   │   ├── api.js          # API configuration
│   │   └── eventService.js # Event data service (mock data)
│   ├── data/               # Static data and configurations
│   │   └── mock-events.json   # Development event data (70 events)
│   ├── App.jsx             # Root application component
│   ├── main.jsx            # Application entry point
│   └── index.css           # Global styles and Tailwind imports
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages deployment workflow
├── public/                 # Static assets
├── dist/                   # Production build output (generated)
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration with testing setup
├── tailwind.config.js     # Tailwind CSS configuration
└── README.md              # Project documentation
```

### Important Files for Development
- **Main Components**: Always check `src/components/features/EconomicCalendar.jsx` for calendar logic
- **Event Data**: Mock data in `src/data/mock-events.json` (70 sample events)
- **Testing Setup**: `src/test/setup.js` configures test environment with mocks
- **Styling**: Global styles in `src/index.css`, component styles use Material Tailwind
- **Configuration**: `vite.config.js` includes test setup and build configuration

### Data Flow
1. `useEvents` hook fetches data from `eventService.js` (currently mock data)
2. `EconomicCalendar.jsx` displays events using Material Tailwind components
3. Filters managed by `useImportance` and custom date range logic
4. Timezone conversion handled by `timezoneUtils.js`

## Common Development Tasks

### Adding New Features
- Create components in appropriate `src/components/` subdirectory
- Add corresponding tests in `__tests__/` directory
- Update mock data in `src/data/mock-events.json` if needed
- Always test with complete user scenarios after changes

### Modifying Styles
- Use Material Tailwind components where possible
- Add custom Tailwind classes for specific styling needs
- Global styles go in `src/index.css`
- Configuration in `tailwind.config.js`

### Working with Data
- Currently uses mock data from `src/data/mock-events.json`
- Event structure: `{ date, country, event, importance, source, category, tags, created_at, updated_at }`
- API integration ready via `src/services/api.js` (not currently used)

### Testing Guidelines
- Write tests for all new components and utilities
- Use `@testing-library/react` for component testing
- Mock external dependencies in test setup
- Maintain current test coverage levels (64%+ overall)

## Build Output Reference

### Development Server Console Output
```
  VITE v5.0.10  ready in 233 ms
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Build Success Output
```
vite v5.0.10 building for production...
✓ 911 modules transformed.
dist/index.html                   0.52 kB │ gzip:   0.33 kB
dist/assets/index-CcwXxSJL.css  113.03 kB │ gzip:  14.18 kB
dist/assets/index-BwLYiAcj.js   870.73 kB │ gzip: 225.45 kB
✓ built in 4.45s
```

### Test Success Output
```
✓ src/utils/__tests__/dateRangeUtils.test.js (24 tests)
✓ src/components/features/__tests__/NextEventTypewriter.business.test.jsx (15 tests)
✓ src/components/features/__tests__/TimeFormatting.test.jsx (12 tests)
✓ src/components/features/__tests__/EconomicCalendar.business.test.jsx (23 tests)
✓ src/components/features/__tests__/EconomicCalendar.dateLogic.test.jsx (14 tests)
✓ src/utils/__tests__/importanceUtils.test.js (18 tests)
✓ src/utils/__tests__/timezoneUtils.test.js (13 tests)
✓ src/components/features/__tests__/NextEventTypewriter.simple.test.jsx (4 tests)
✓ src/components/ui/__tests__/ImportanceSelector.test.jsx (6 tests)
✓ src/components/features/__tests__/EconomicCalendar.simple.test.jsx (5 tests)
✓ src/utils/__tests__/soundUtils.test.js (3 tests)

Test Files  11 passed (11)
Tests  137 passed (137)
Duration  6.26s
```

## Known Issues and Workarounds

### Dependencies
- `npm audit` reports 2 vulnerabilities (1 moderate, 1 high) related to esbuild/vite
- These don't affect functionality - builds and tests work correctly
- Consider running `npm audit fix --force` if security updates are needed

### Linting
- No ESLint or Prettier configuration currently in place
- Follow existing code style and formatting patterns
- Consider adding these tools if consistent code formatting becomes important

### Performance Notes
- Bundle size warning for large chunks (870KB JS) - consider code splitting for production optimization
- Current setup prioritizes developer experience over bundle optimization
- All builds and tests complete quickly (under 10 seconds each)

## Application Screenshot
![Economic Calendar Application](https://github.com/user-attachments/assets/56f7ddda-7f1a-4e1f-ac85-79ddb4d955cc)

The application displays a clean, professional interface with:
- Economic event calendar with filtering options
- Time period selection (Today, Tomorrow, This Week, etc.)
- Importance level filtering (Low, Medium, High)
- Timezone selection with UTC default
- Paginated event display with configurable rows per page
- Responsive Material Tailwind design