# Agent Guide for december

This document provides context for LLM agents contributing to the `december`
repository. Read [CONTRIBUTORS.md](CONTRIBUTORS.md) first: its setup, commands,
privacy rules, and conventions apply to agents exactly as they do to people.

## Project Overview

`december` is a checklist of what a household wants to do in December in
anticipation of the holidays, published as a static site.

**The repository is public.** Never write a home address into any file,
commit message, issue, or pull request, and keep other personal details out.
If a task seems to need one, leave it out and say so.

**Key Technologies:**

- Node.js (see `.node-version` for the current version) with TypeScript
- ESM throughout — `package.json` sets `"type": "module"`
- SvelteKit with `@sveltejs/adapter-static`, prerendering every page
- ESLint (flat config) with `@biffud/eslint-config` and `eslint-plugin-svelte`
- Prettier for formatting, with `prettier-plugin-svelte`
- Vitest for tests

## The Site

The site is a fully static SvelteKit build. SvelteKit 3 has no
`svelte.config.js`: its configuration is passed to the `sveltekit()` plugin in
`vite.config.ts`. `src/routes/+layout.ts` turns on prerendering for every
route, so anything a page shows has to be available at build time.

GitHub Pages serves the site from `/<repository>`, not from the root. The
deploy workflow passes that prefix to the build as `BASE_PATH`, which becomes
`paths.base`. Links inside the site go through `resolve()` from `$app/paths`
so they carry the prefix. A hard-coded `/` path works under `npm run dev` and
breaks once deployed.

`tsconfig.json` extends `$app/tsconfig`, which `svelte-kit sync` generates
into `node_modules`. The `prepare` script runs that on install. If type
checking complains that the config cannot be found, run `npx svelte-kit sync`.

**Import from `src/lib` with `#lib/`.** SvelteKit 3 no longer generates a
`$lib` alias. `package.json` maps `#lib/*` to `./src/lib/*` through Node's
subpath imports. Modules inside `src/lib` import each other relatively.

```
src/
├── app.css            # Global styles
├── app.html
└── routes/
    ├── +layout.ts     # Prerender everything
    ├── +layout.svelte # Loads app.css
    └── +page.svelte   # Home page
```

**Styling is deliberately plain.** Browser defaults, a sans-serif font, black
on white. The visual design hasn't been done yet, so don't add colours, custom
fonts, or decorative styling. Add only the layout a feature needs to work.

## After Making Changes

**Always run the formatter and linter after making ANY changes, including
documentation, configuration, and JSON files:**

```bash
npm run format
npm run lint
```

## Code Conventions

Beyond those in CONTRIBUTORS.md:

1. **No magic numbers** — pull them out into named constants.
2. **Explicit return types** — required for all functions (except test files).
3. **Type-only imports** — `verbatimModuleSyntax` is on, so type-only imports
   must use `import type`.
4. **`erasableSyntaxOnly` is on** — no `enum`, no parameter properties, no
   namespaces with runtime output. Use `const` objects with `as const` and
   union types in place of enums.

### Testing

Import the helpers explicitly — `import { describe, expect, it } from "vitest"`.
Globals are deliberately off. `vitest.config.ts` extends `vite.config.ts`, so
tests resolve imports the way the build does.

**Invented data never wears a real name.** Fixtures use ids like `TEST-1` and
put `TEST` in titles.

### Formatting

`.prettierrc.json` only loads `prettier-plugin-svelte`. Prettier otherwise runs
on its defaults, shifted only by `.editorconfig` (`indent_style = tab`).

## Version Constraints

- **TypeScript stays on 6.x.** `typescript-eslint` does not support TypeScript
  7 yet.
- **`@types/node` tracks `.node-version`**, not the latest release.
- **ESLint moves with `@biffud/eslint-config`.** The config's major version is
  the ESLint major it supports, and it is on a `~` range because its minor
  releases are the ones that change rules.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and on pull requests, with
one job apiece for `actionlint`, `npm-install` (lockfile in sync), `eslint`,
`prettier`, `svelte-check`, `test`, and `build`.

`.github/workflows/deploy.yml` runs on pushes to `main`. It builds the site with
the Pages base path and publishes `build/` to GitHub Pages.

## Maintaining This Document

Keep this document current as the codebase evolves: update it when patterns,
structure, scripts, CI jobs, or version constraints change. Keep it
user-agnostic, reference version files rather than hardcoding versions, and do
not record project status here.
