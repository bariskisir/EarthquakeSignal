# Earthquake Signal -- Development Guide

## Project Overview

Earthquake Signal is a secure Electron desktop application shell. It provides local session
management, application settings, localization, logging, system-tray integration, and
GitHub-based update checks. Feature-specific workspace content can be added without exposing
Node.js or Electron APIs directly to the renderer.

## Tech Stack

| Layer         | Technology                               |
| ------------- | ---------------------------------------- |
| Desktop shell | Electron 43 with `vite-plugin-electron`  |
| Build         | Vite 8                                   |
| Language      | TypeScript 7.0                           |
| UI            | React 19.2, Redux Toolkit, Ant Design    |
| Styling       | SCSS Modules                             |
| Localization  | i18next and react-i18next                |
| Validation    | Zod                                      |
| Logging       | electron-log and the renderer log bridge |
| Testing       | Vitest                                   |
| Packaging     | electron-builder                         |

## Architecture

- `src/main/` owns Electron APIs, storage, logging, tray integration, and updates.
- `src/preload/` exposes the typed, allow-listed `EarthquakeSignalApi` bridge.
- `src/renderer/` contains the sandboxed React interface and Redux state.
- `src/shared/` contains serializable contracts and application identity constants.
- `tests/` contains unit and integration tests.

The renderer must use `window.app.*` for system interaction. Do not expose raw Node.js or
Electron objects through preload.

## Sessions

Sessions are generic local workspaces stored as JSON under the application data directory.
Each document contains an identifier, title, default-title flag, and creation/update timestamps.
There must always be at least one session.

## Coding Conventions

- Keep TypeScript strict and avoid `any`.
- Validate unknown IPC input with Zod.
- Use dependency injection for main-process services.
- Keep shared state in the Redux application slice.
- Put business logic in hooks and keep components presentational.
- Use SCSS Modules and existing theme variables.
- Use the logging services instead of `console`.
- Add JSDoc to exported classes, functions, interfaces, and type aliases.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run test
npm run lint
npm run format
npm run format:check
npm run package
npm run package:win
npm run package:linux
```

## Testing

Vitest runs in the Node environment. Keep tests focused on state transitions, validation,
storage behavior, desktop service boundaries, and localization resource consistency.
