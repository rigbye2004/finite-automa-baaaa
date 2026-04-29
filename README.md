# Finite Automa-baaaa

## Running locally

### Prerequisites

- **Node.js** (v18 or later recommended)
- **npm** (bundled with Node.js)

### Installation

From the project root:

```bash
npm install
```

### Development mode

To run the game locally with hot reloading:

```bash
npm run dev
```

This starts a development server at `http://localhost:5173` by default. Open the URL printed in the terminal to play.

### Production build

To produce an optimised static build (output to `dist/`):

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

### Tests

To run the unit tests:

```bash
npm test
```

## File structure

```
.
├── public/              Static assets (sounds, images, SVG sheep/farmer)
├── src/                 Source code (React components, game logic, types)
├── index.html           Entry point
├── package.json         Dependencies and scripts
├── package-lock.json    Locked dependency versions
├── tsconfig.json        TypeScript configuration
├── vite.config.js       Vite build configuration
└── README.md            This file
```
