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
- Zod for data schemas and the types derived from them

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
├── routes/
│   ├── +layout.ts     # Prerender everything
│   ├── +layout.svelte # Loads app.css
│   └── +page.svelte   # Home page
└── lib/
    ├── components/    # Svelte components
    ├── data/          # One JSON file per entry, loaded and validated
    ├── dates.ts       # Year-less MM-DD dates
    ├── format.ts      # Turns data values into display text
    ├── schemas/       # Zod schemas for each entity, and their inferred types
    ├── snow.ts        # Snowfall that piles up on closed activity headers
    ├── snowflake.ts   # How a single flake moves, lands, and falls off
    └── timeline.ts    # Orders activities by when in the season they happen
```

**Styling is deliberately plain.** Browser defaults, a sans-serif font, black
on white. The visual design hasn't been done yet, so don't add colours, custom
fonts, or decorative styling. Borders and black or grey header bars are fine
where they show how information is grouped. Add only the layout a feature
needs to work. The opt-in snow is a deliberate exception: it is meant to get
in the way.

## Data

Each entity is a Zod schema in `src/lib/schemas/`, and its TypeScript type is
inferred from the schema with `z.infer`, never written separately. The schemas
are the documentation of the data model; don't restate their fields elsewhere.
[docs/SCHEMAS.md](docs/SCHEMAS.md) explains in plain language what each schema is
for, with a link to its file. Keep it current when a schema is added, removed,
or changes purpose.

- **Files, not a database.** Data is JSON in the repository, validated by the
  schemas at build time.
- **File names are ids.** An activity's file name, without `.json`, is its id
  and the fragment that links to it on the site, so renaming a file breaks
  links to it.
- **Describe the activity, not one year of it.** The same data works year
  after year, so schemas hold no state (done, skipped, watched, actual cost)
  and no date carries a year: dates are `MM-DD`, and timing is counted in days
  relative to a date the entry names.
- **Non-denominational where possible.** Don't build a particular holiday into
  the schemas; let the data name the dates that matter to it.
- **Schemas are strict.** Unknown fields are errors, which keeps state and
  stray personal details out of the data.
- **Fixed vocabularies live in code.** Phases, categories, and participants
  are `z.enum` schemas, not data files.
- **Participants are who takes part**, never who is responsible.

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
