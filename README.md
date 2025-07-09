# Economic Calendar - React & Tailwind Web App

A modern, responsive economic calendar web application built with React and Tailwind CSS, designed for performance, accessibility, and developer experience.

## 🚀 Tech Stack

- **Frontend Framework**: React 18+ with hooks
- **Styling**: Material Tailwind
- **Build Tool**: Vite
- **Language**: JavaScript/TypeScript
- **Package Manager**: npm

## 📋 Prerequisites

Before getting started, ensure you have the following installed:

- Node.js (v18+ recommended)
- npm
- Git
- VS Code (recommended) with Tailwind CSS IntelliSense extension

## 🛠️ Project Setup

### 1. Initialize the Project

```bash
# Create Vite React app with TypeScript
npm create vite@latest economic-calendar -- --template react-ts
cd economic-calendar
npm install
```

### 2. Install and Configure Tailwind CSS

```bash
# Install Tailwind CSS and its dependencies
npm install -D tailwindcss postcss autoprefixer

# Generate Tailwind config files
npx tailwindcss init -p
```

### 3. Install Material Tailwind

```bash
# Install Material Tailwind
npm i @material-tailwind/react

```

### 4. Configure Tailwind CSS

Update `tailwind.config.js`:

```javascript
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
});
```

Replace the contents of `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Setup Material Tailwind Theme Provider

Update `src/main.tsx`:

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "@material-tailwind/react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

## 🔧 Development Workflow

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

### Code Quality Tools

Install and configure these tools for better development experience:

```bash
# ESLint and Prettier
npm install -D eslint prettier eslint-config-prettier eslint-plugin-react

# Tailwind CSS IntelliSense (VS Code extension)
# Auto-completion and linting for Tailwind classes
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deployment Options

1. **Vercel** (Recommended for React apps)
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Netlify**
   - Connect your Git repository
   - Set build command: `npm run build`
   - Set publish directory: `dist` (Vite)

3. **GitHub Pages**
   ```bash
   npm install -D gh-pages
   npm run build
   npx gh-pages -d dist
   ```

## 🔍 Troubleshooting

### Common Issues

**Tailwind styles not applying:**
- Check if Tailwind directives are imported in `src/index.css`
- Verify content paths in `tailwind.config.js`
- Ensure PostCSS is configured properly

**Build errors:**
- Clear node_modules and reinstall dependencies
- Check for conflicting package versions
- Verify all imports and file paths

**Performance issues:**
- Enable React DevTools Profiler
- Check for unnecessary re-renders
- Optimize large lists with virtualization

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Material Tailwind Documentation](https://www.material-tailwind.com/docs/react/installation)
- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy coding!** 🎉

For questions or support, please open an issue or contact the development team.
