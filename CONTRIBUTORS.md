# Contributing to december

## Setup

Requires Node (see [`.node-version`](.node-version)).

```bash
npm ci
```

## Commands

```bash
npm run dev            # serve the site locally, reloading on change
npm run build          # build the static site into build/
npm run preview        # serve the built site
npm run lint           # eslint, prettier, svelte-check
npm run format         # fix what can be fixed automatically
npm test               # run the tests once
npm run test:watch     # re-run the tests on change
npm run test:coverage  # run the tests with a coverage report
```

Run `npm run format` and then `npm run lint` before opening a pull request. CI
runs the same checks.

## Privacy

This repository and the site it builds are public.

- **Never commit a home address**, ours or anyone else's.
- Keep other personal details to what the list needs: first names are fine;
  phone numbers, emails, and exact locations are not.
- Private notes go in `local/`, which git ignores.

## Deployment

Every push to `main` builds the site and publishes it to GitHub Pages. The
repository's Pages source must be set to "GitHub Actions".

## Conventions

- **No code comments.** Code should explain itself. If something seems to need
  a comment, give it a well-named helper function, constant, or variable
  instead. Reasoning that still needs saying goes in the commit message.
- **Named exports only.** No default exports, except where a tool requires
  one (such as `eslint.config.mjs` and `vitest.config.ts`).
- **Tests live in `__tests__` folders** beside the code they cover, and are
  named `*.test.ts`.
- **Formatting is Prettier's**, with tabs and double quotes from
  `.editorconfig`. Don't hand-format.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/),
with one addition: commits that change data are scoped to the entity they
touch.

```
feat(activity): Add putting up lights
fix(activity): Correct the lights checklist
feat(schema): Add a home category for activities
docs: Adopt Conventional Commits
```

- **Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, and
  `chore`.
- **Data:** adding an entry is `feat(<entity>)`, and correcting or updating
  one is `fix(<entity>)`, with the entity named as its schema is (`activity`,
  `shopping-location`).
- **Code:** a scope is optional; use one when it narrows things down, such as
  `schema` for changes to the data model.
- **Description:** imperative mood, capitalized, no trailing period. Keep the
  whole subject line within 50 characters.

## Dependency constraints

- **TypeScript stays on 6.x** until `typescript-eslint` supports TypeScript 7.
- **`@types/node` follows `.node-version`**, not the latest release.

Dependabot is set to ignore major updates for both.
