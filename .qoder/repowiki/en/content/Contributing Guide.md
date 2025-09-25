# Contributing Guide

<cite>
**Referenced Files in This Document**   
- [package.json](file://package.json)
- [eslint.config.mjs](file://eslint.config.mjs)
- [postcss.config.mjs](file://postcss.config.mjs)
- [next.config.ts](file://next.config.ts)
- [tsconfig.json](file://tsconfig.json)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [midiExportService.ts](file://src/services/midiExportService.ts)
- [Button.tsx](file://src/components/ui/Button.tsx)
- [README.md](file://README.md)
</cite>

## Table of Contents
1. [Development Setup](#development-setup)
2. [Code Style and Formatting](#code-style-and-formatting)
3. [Testing Procedures](#testing-procedures)
4. [Pull Request Process](#pull-request-process)
5. [Build and Deployment Workflow](#build-and-deployment-workflow)
6. [Contribution Suggestions](#contribution-suggestions)
7. [Existing Code Patterns](#existing-code-patterns)

## Development Setup

To contribute to korysmiditoolbox, you need to set up your development environment with the correct tools and dependencies. The project is built using modern web technologies with a focus on static site deployment.

### Node.js Version Requirement
The application requires **Node.js 18 or higher** for development and production builds. This version ensures compatibility with Next.js 15 features and TypeScript support used throughout the codebase.

### Dependency Installation
After cloning the repository, install all required dependencies using npm:

```bash
git clone <repository-url>
cd korysmiditoolbox
npm install
```

This installs both production and development dependencies listed in package.json, including:
- Next.js 15.5.4 framework
- React 19.1.0 and React DOM
- TypeScript ^5
- Tailwind CSS and PostCSS
- ESLint for code linting
- Google Generative AI SDK

### IDE Configuration for TypeScript
Configure your IDE (VS Code recommended) with the following settings for optimal TypeScript development:

1. Install TypeScript and JavaScript language features extension
2. Enable strict type checking as defined in tsconfig.json
3. Set path aliases: `@/*` maps to `./src/*`
4. Configure editor to respect Prettier formatting rules
5. Enable ESLint integration for real-time feedback

The tsconfig.json enforces strict compilation options including `strict: true`, `esModuleInterop: true`, and module resolution set to "bundler" for compatibility with modern tooling.

**Section sources**
- [package.json](file://package.json)
- [tsconfig.json](file://tsconfig.json)
- [README.md](file://README.md)

## Code Style and Formatting

korysmiditoolbox enforces consistent code style through ESLint and formatting rules via Prettier/Tailwind configuration.

### ESLint Rules (eslint.config.mjs)
The project uses a flat config approach with ESLint, extending from Next.js core configurations. Key rules include:

- Extends `next/core-web-vitals` and `next/typescript` for framework-specific best practices
- Ignores build directories (.next/, out/, build/) and type declaration files
- Enforces modern JavaScript and React patterns
- Integrates with Next.js routing and API conventions

The configuration leverages FlatCompat for backward compatibility while using the modern flat config format. It specifically excludes node_modules and generated files from linting.

### Formatting Rules (Prettier/postcss.config.mjs)
Style formatting follows these guidelines:

- **PostCSS Configuration**: Uses @tailwindcss/postcss plugin for processing Tailwind directives
- **Tailwind CSS**: Utility-first approach with dark mode support
- **Class Variance Authority**: For consistent component variants (e.g., Button styles)
- **No custom CSS**: Styles are defined exclusively through Tailwind classes

The postcss.config.mjs file specifies the Tailwind plugin as the sole processor, ensuring styles are properly generated during build.

**Section sources**
- [eslint.config.mjs](file://eslint.config.mjs)
- [postcss.config.mjs](file://postcss.config.mjs)
- [Button.tsx](file://src/components/ui/Button.tsx)

## Testing Procedures

Currently, the project does not have an established testing framework, but contributors are encouraged to implement comprehensive test coverage.

### Recommended Testing Frameworks
For future development, consider establishing:

#### Unit Testing
- **Framework**: Jest with React Testing Library
- **Coverage**: Core utility functions (midiUtils.ts), service classes (GeminiService, MidiExportService)
- **Example Target**: Test note validation in midiUtils.ts, MIDI export functionality in midiExportService.ts

#### Integration Testing
- **Framework**: Cypress or Playwright
- **Scope**: User workflows like generating chord progressions, editing notes in PianoRoll, exporting MIDI/WAV
- **Critical Paths**: API key validation, localStorage persistence, audio playback controls

Test cases should verify both happy paths and error conditions, particularly around API connectivity and user input validation.

**Section sources**
- [midiExportService.ts](file://src/services/midiExportService.ts)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)

## Pull Request Process

Follow this standardized workflow when contributing to korysmiditoolbox:

### Forking and Branch Creation
1. Fork the repository on GitHub
2. Create a feature branch from main: `git checkout -b feature/descriptive-name`
3. Ensure your branch name clearly describes the change

### Commit Conventions
Use conventional commits format:
- `feat: add new feature`
- `fix: resolve bug`
- `docs: update documentation`
- `style: format code`
- `refactor: improve implementation`
- `test: add tests`
- `chore: maintenance tasks`

Each commit should represent a logical unit of work with a clear message explaining the change and its purpose.

### Code Review Expectations
PRs will be evaluated on:
- Code quality and adherence to existing patterns
- Proper TypeScript typing
- Performance implications
- Accessibility improvements
- Comprehensive changes (avoid partial implementations)
- Updated documentation if applicable

All code must pass ESLint checks and maintain the project's visual consistency through Tailwind usage.

**Section sources**
- [README.md](file://README.md)

## Build and Deployment Workflow

The application uses Next.js static site export for deployment, enabling hosting on any static file server.

### Build Process
Execute the build command:
```bash
npm run build
```

This generates static HTML files in the `out/` directory using Next.js's static export feature configured in next.config.ts with `output: 'export'`.

### Deployment Configuration
Key settings in next.config.ts:
- `trailingSlash: true` - Ensures consistent URL structure
- `images: { unoptimized: true }` - Disables Next.js image optimization for static export
- `reactStrictMode: true` - Enables additional React development checks

The build process creates fully static assets that can be deployed to:
- GitHub Pages (push `out/` to gh-pages branch)
- Netlify (connect repository with build command)
- Vercel (import repository)
- Any static hosting provider

**Section sources**
- [next.config.ts](file://next.config.ts)
- [README.md](file://README.md)

## Contribution Suggestions

Consider these areas for improvement when contributing to korysmiditoolbox:

### Accessibility Enhancements
- Add ARIA labels to interactive elements
- Improve keyboard navigation in PianoRoll
- Ensure sufficient color contrast in both light/dark themes
- Implement screen reader support for musical notation

### New Features
- Chord detection and labeling
- Tempo/BPM adjustment controls
- Multiple track support
- Audio effects (reverb, delay)
- Music theory visualization tools

### Documentation Improvements
- Interactive tutorial for first-time users
- API reference for developers
- Video demonstrations of key workflows
- Keyboard shortcut guide
- Detailed error messages and troubleshooting

### Performance Optimizations
- Memoization of expensive calculations in PianoRoll
- Web Worker offloading for MIDI generation
- Canvas rendering optimizations
- Bundle size reduction

**Section sources**
- [README.md](file://README.md)

## Existing Code Patterns

Follow these established patterns for consistency across the codebase:

### Component Structure
Components follow a consistent pattern seen in Button.tsx:
- Use class-variance-authority (cva) for variant management
- Support loading states with spinner indication
- Accept leftIcon/rightIcon props for flexible icon placement
- Utilize cn utility for conditional class composition

### State Management
The AppContext pattern manages global state with localStorage persistence:
- Centralized state in AppContext.tsx
- Actions for modifying state (addNote, updateNote, etc.)
- Automatic saving to localStorage
- Theme preference persistence

### Service Classes
Services like MidiExportService use class-based patterns:
- Single responsibility principle
- Clear public interface
- Private helper methods
- Type-safe parameters and return values

### UI Consistency
Visual elements maintain consistency through:
- Tailwind class naming conventions
- Reusable Button component with variants
- Dark/light theme support via CSS classes
- Responsive design principles

**Section sources**
- [Button.tsx](file://src/components/ui/Button.tsx)
- [PianoRoll.tsx](file://src/components/PianoRoll.tsx)
- [midiExportService.ts](file://src/services/midiExportService.ts)
- [AppContext.tsx](file://src/context/AppContext.tsx)