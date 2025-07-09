# Claude Development Guide - Economic Calendar

Development guidelines for building the Economic Calendar with React and Tailwind CSS using Material Tailwind

## 🚀 Tech Stack

- **Frontend Framework**: React 18+ with hooks
- **Styling**: Material Tailwind
- **Build Tool**: Vite
- **Language**: JavaScript/TypeScript
- **Package Manager**: npm

## 📁 Project Structure

```
economic-calendar/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components (buttons, cards, etc.)
│   │   ├── layout/       # Layout components (header, sidebar, footer)
│   │   └── features/     # Feature-specific components (calendar, events)
│   ├── hooks/           # Custom React hooks (useCalendar, useEvents)
│   ├── utils/           # Utility functions (date helpers, formatters)
│   ├── data/            # Mock data and constants
│   ├── styles/          # Additional CSS files
│   ├── assets/          # Images, icons, etc.
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## 🎨 Design System & Components

### Color Palette
- **Primary**: Blue shades for main actions and branding
- **Gray**: Neutral colors for text and backgrounds
- **Success**: Green for positive actions
- **Warning**: Yellow/Orange for cautions
- **Error**: Red for errors and destructive actions

### Typography
```css
/* Heading styles */
.heading-1 { @apply text-4xl font-bold text-gray-900; }
.heading-2 { @apply text-3xl font-semibold text-gray-800; }
.heading-3 { @apply text-2xl font-medium text-gray-800; }

/* Body text */
.body-large { @apply text-lg text-gray-700; }
.body-base { @apply text-base text-gray-600; }
.body-small { @apply text-sm text-gray-500; }
```

### Component Guidelines
- Use semantic HTML elements
- Implement proper ARIA labels for accessibility
- Follow mobile-first responsive design
- Utilize Tailwind's utility classes for consistency
- Create reusable components in the `components/ui/` directory

## 📊 Economic Calendar Specific Guidelines

### Data Structure
```javascript
// Economic Event Structure (MongoDB Schema)
const economicEvent = {
  _id: ObjectId,
  date: string,              // ISO 8601 date string
  country: string,           // Country code (e.g., "USA")
  event: string,             // Event title/description
  importance: string,        // 'low' | 'medium' | 'high'
  source: {
    name: string,            // Source organization name
    url: string              // Source URL
  },
  category: string,          // Event category (e.g., "employment", "housing")
  tags: string[],            // Array of tags for categorization
  created_at: string,        // ISO 8601 timestamp
  updated_at: string         // ISO 8601 timestamp
};
```

### Key Features to Implement
- **Calendar View**: Monthly, weekly, daily views
- **Event Filtering**: By country, currency, impact level
- **Time Zone Support**: Display events in user's local time
- **Event Details**: Modal/sidebar with full event information
- **Search Functionality**: Search events by title, country, or category
- **Responsive Design**: Mobile-first calendar layout

### Component Architecture
- `CalendarGrid`: Main calendar display component
- `EventCard`: Individual event display
- `EventFilter`: Filtering controls
- `EventModal`: Detailed event view
- `TimeZoneSelector`: User timezone preferences
- `CountryFlag`: Display country flags for events

## 🎯 Best Practices

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize with React.memo() for expensive components
- Use useCallback and useMemo for performance optimization
- Follow the DRY principle for reusable logic

### Tailwind Best Practices
- Use responsive design utilities (`sm:`, `md:`, `lg:`, `xl:`)
- Create custom components for repeated patterns
- Utilize Tailwind's design tokens for consistency
- Leverage JIT mode for smaller bundle sizes
- Use `@apply` directive sparingly for component styles

### Performance Optimization
- Implement code splitting with React.lazy()
- Optimize images and assets
- Use Tailwind's purge feature for production builds
- Minimize bundle size with tree shaking
- Implement proper caching strategies

---

**Development Guidelines Complete!** 🎉

For project setup, deployment, and general information, see the [`README.md`](README.md) file.