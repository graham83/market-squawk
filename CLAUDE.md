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
## AI Development Assistant

### Claude AI Model Information
This repository utilizes **Claude 3.5 Sonnet** by Anthropic for code completions, development assistance, and documentation generation. Claude is a large language model designed to be helpful, harmless, and honest.

#### Key Capabilities:
- **Code Generation**: Advanced understanding of React, JavaScript/TypeScript, and modern web development patterns
- **Architecture Guidance**: Assistance with component design, state management, and best practices
- **Testing Support**: Help with writing comprehensive tests using Vitest and React Testing Library
- **Documentation**: Generation of clear, maintainable documentation and code comments
- **Debugging**: Analysis of code issues and suggestion of targeted fixes

#### Development Workflow Integration:
- Follows established patterns from Material Tailwind and React ecosystem
- Maintains consistency with existing codebase structure and conventions
- Provides context-aware suggestions based on project-specific requirements
- Ensures compatibility with Vite build system and testing framework

The AI assistant is particularly effective at understanding the Economic Calendar domain and can provide relevant suggestions for financial data visualization, event management, and user interface components.

## Repository Etiquette
- Maintain linear git history using rebase and no merge commits
- Keep commit messages to a single encompassing message upto 100 characters

## 🎨 Design System & Components

### Component Guidelines
- Always use material tailwind components where relevant
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