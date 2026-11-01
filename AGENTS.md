tla-ts interprets and model checks TLA+ specs in TypeScript, without the JVM. `packages/tla-ts` is the library. `packages/tla-ts/tests/unit` holds its unit tests.

When implementing anything in this project, clone `tlaplus/tlaplus` locally and search TLC's source to understand the relevant TLA+ semantics. Do not rely on memory or assumptions.

## tla-ts rules

- Match TLC's semantics. When behavior is unclear, run the spec through TLC and compare.
- Keep the public API small. Justify every new export.
- Throw named errors from `src/errors.ts` and let them propagate. Do not wrap them in helpers such as `fail()`.
- Do not add timeouts unless asked.

## Verifying changes

Run `pnpm check`, `pnpm typecheck`, and `pnpm test` before you finish.

## Branch names

Use a short branch name of at most three words, separated by hyphens. Do not use slashes or type prefixes such as `feat/` or `fix/`.

Examples: `parse-operators`, `fix-set-equality`, `cleanup-tests`.

## Commits and PR titles

Use conventional commit messages and PR titles: `type(scope): summary`.

Valid types are `feat`, `fix`, `docs`, `chore`, `refactor`, and `test`. Scopes are optional. Use the affected area when helpful, such as `parser`, `evaluator`, or `checker`.

Examples: `feat(parser): parse LET and IN`, `fix(evaluator): compare records by field`, `test: port TLC set tests`.

Keep each commit and PR to one concern. Never merge with failing CI, and merge only when asked.

Follow the writing rules below for PR descriptions.

## Writing

Follow these steps for documentation, technical prose, and PR descriptions.

1. Fetch and read [the current writing rules](https://aidenybai.com/blog/write.md).
2. Read the code, docs, and history behind the subject. If they don't answer a question, ask instead of guessing.
3. Pick the content type from the rules. Outline the headings, then draft each section.
4. Check the text against every rule. After you revise, check the revised text again.

## Style guide

- Keep code clean, elegant, and simple. YAGNI.
- Remove unused code. Don't repeat yourself.
- Use TypeScript for all project-authored code.
- Prefer `const`. Use ternaries or early returns instead of reassignment and `else`.
- Use arrow functions and kebab-case file names.
- Avoid `any`. Avoid `as` unless necessary.
- Never use star imports or alias imports, such as `import { resolve as pathResolve }`.
- Omit file extensions in relative imports: `./core`, not `./core.js`.
- Use pnpm for project scripts. They bundle with Bun and run with Node, through `scripts/run.ts`.
- Use TypeScript interfaces over types. Keep them at module scope.
- Rely on type inference. Add annotations only for exports.
- Do not extract single-use helpers or variables. Inline them at the call site unless the helper is reused, hides a complex boundary, or has a name that clarifies the caller.
- Do not comment unless necessary. Prefix hacks, such as a `setTimeout`, with `// HACK: reason`.
- Avoid `try`/`catch` where possible.
- Use descriptive names. Avoid one or two character names.
  - In `.map()`, use `innerX` instead of `x`.
  - Use `isMoved` instead of `moved`.
  - Use `get`, `set`, and `use` prefixes.
- Use dot notation instead of destructuring, so `obj.a` keeps its context.

## Testing

- Avoid mocks. Use `globalThis` only when nothing else works.
- Test behavior, not implementation. Do not copy logic into tests.
- Make tests deterministic.
- Prefer specs ported from `tlaplus/Examples` and TLC's own tests over synthetic fixtures.
- Never weaken a test to make it pass. Fix the cause.
