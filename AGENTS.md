# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src`, with page-level routes under `src/pages`, reusable widgets in `src/components`, and shared logic in `src/hooks` and `src/lib`. Tailwind theming and global styles are defined in `src/index.css`, while static assets reside in `public`. Configuration lives at the root (`vite.config.ts`, `tailwind.config.ts`, `eslint.config.js`, multiple `tsconfig` variants) and drives build, styling, and lint behaviour. Use the `@/` path alias for imports from `src` to keep module references concise (`import { ChatSidebar } from "@/components/ChatSidebar";`).

## Build, Test, and Development Commands
Run `npm install` once to sync dependencies. Use `npm run dev` for the hot-reloading Vite dev server and `npm run preview` to exercise the built bundle locally. Ship code with `npm run build`; `npm run build:dev` mirrors production but keeps dev-friendly flags enabled. Check lint errors before pushing via `npm run lint`, which uses the repository’s unified ESLint + TypeScript config.

## Coding Style & Naming Conventions
Write React function components in TypeScript (`.tsx`) with two-space indentation and named exports when reuse is expected. Co-locate UI fragments and hooks by feature to keep imports shallow. Prefer Tailwind utility classes for styling; add new design tokens in the CSS custom properties defined in `src/index.css` (all colours are HSL). Keep component filenames in PascalCase (`ChatArea.tsx`), hooks in camelCase (`useChatStore.ts`), and avoid default exports from shared modules unless the module exposes a single concern.

## Testing Guidelines
An automated test suite is not yet wired up—new work should introduce tests alongside features. Co-locate Vitest + React Testing Library specs in `src/__tests__` or next to the component using the `.test.tsx` suffix, and aim for high-value coverage on stateful hooks and complex UI flows. Document any required fixtures or test data under `src/lib/test-data` when you add them. Update this section once the first testing toolchain lands.

## Commit & Pull Request Guidelines
Follow the existing log’s pattern: concise, capitalised imperative subjects with optional context tags (`Fix: Improve mobile responsiveness`). Reference issue IDs when applicable and squash fixup noise locally. Pull requests should include: a clear summary of behaviour, screenshots or GIFs for UI changes, a note on testing performed (manual steps or commands), and any follow-up tasks. Highlight breaking or migration-impacting changes near the top of the description so reviewers can plan their checks.
