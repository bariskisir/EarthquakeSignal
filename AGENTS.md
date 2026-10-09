# Repository Guidelines

## Project Structure & Module Organization

This is an Electron desktop app built with Vite, React, and TypeScript. Keep process boundaries explicit:

- `src/main/` contains Electron lifecycle code, IPC handlers, security policies, and native-facing services.
- `src/preload/` exposes the deliberately limited renderer bridge.
- `src/renderer/src/` holds the React UI: pages, components, hooks, Redux store, styling, and i18n locales.
- `src/shared/` contains types, IPC channel definitions, earthquake domain models, and other code safe to share across processes.
- `tests/` mirrors source concerns with focused Vitest files such as `EarthquakeFilters.test.ts`.
- `build/` stores application icons; `images/` holds README artwork. Do not place generated output under source directories.

## Build, Test, and Development Commands

Use Node.js 24 or newer and install dependencies with `npm ci` (or `npm install` for local dependency changes).

- `npm run dev` starts the Vite/Electron development environment.
- `npm run build` type-checks both process targets and creates the production build.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm test` runs the Vitest suite once; use `npm run test:watch` while iterating.
- `npm run lint` runs Biome against application code and tests.
- `npm run format:check` verifies Prettier formatting; `npm run format` applies it.
- `npm run package:win:x64` or `npm run package:linux:x64` builds platform installers.

## Coding Style & Naming Conventions

Follow `.editorconfig`: UTF-8, LF line endings, two-space indentation, and final newlines. Prettier enforces no semicolons, single quotes, trailing commas, and a 100-character print width. Use PascalCase for React components, classes, and service files (`WindowService.ts`); camelCase for functions, variables, and hooks (`useAppInit.ts`); and `*.module.scss` for component-scoped styles. Keep IPC channels and shared contracts in `src/shared/`, and avoid exposing Electron APIs directly to renderer code.

## Testing Guidelines

Write focused Vitest unit tests in `tests/`, named `<Subject>.test.ts`. Cover new validation, IPC behavior, service logic, and security-policy changes; mock Electron or network boundaries rather than requiring a desktop runtime. Run `npm test`, `npm run typecheck`, and `npm run lint` before opening a pull request. No repository-wide coverage threshold is configured.

## Commit & Pull Request Guidelines

Use concise, imperative Conventional Commit-style subjects reflected in history: `feat(map): add tile provider`, `fix: suppress replayed notifications`, or `chore(deps): bump dependency`. Keep commits narrowly scoped. Pull requests should describe the user-visible change and testing performed, link relevant issues, and include screenshots for renderer/UI changes. Call out packaging, permission, telemetry, update, or configuration changes explicitly.
