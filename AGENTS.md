tla-ts interprets and model checks TLA+ specs in TypeScript, without the JVM. `packages/tla-ts` is the library. `packages/tla-ts/tests/unit` holds its unit tests.

When implementing anything in this project, clone `tlaplus/tlaplus` locally and search TLC's source to understand the relevant TLA+ semantics. Do not rely on memory or assumptions.

## tla-ts rules

- Match TLC's semantics. When behavior is unclear, run the spec through TLC and compare.
- Match SANY, tlapm, Z3, Zenon and Isabelle the same way. Read the reference source at the commit the port tracks, and compare output byte for byte.
- Never copy a reference bug. Where the reference gives a wrong answer, crashes or hangs, keep tla-ts correct, add a test, and list the deviation in the PR.
- Never port unsound reference behavior, such as Zenon's wrong rule for a subset of an intersection.
- Never add a default or inference that lets a buggy spec pass. tla-ts doesn't infer `@initially`, because that would turn a buggy invariant into a filter.
- Never run an external solver from `PATH`. A prover without a port reports `tla-ts has no <prover> backend`.
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

Change the README only in the root Development section, and keep it short. Do not add package READMEs or other `.md` files. Document a new option with a one-line comment on its field in the TypeScript interface.

## Style guide

- Keep code clean, elegant, and simple. YAGNI. Build for the inputs that exist, with no speculative options, parsers or guards.
- Remove unused code: exports, parameters, fields, branches, and options nobody passes. A field that is written but never read is unused.
- Don't repeat yourself. Grep `src` for an existing helper before you write one.
- Use TypeScript for all project-authored code.
- Prefer `const`. Use ternaries or early returns instead of reassignment and `else`. Keep `let` in loops, accumulators and hot paths.
- Do not box a value to avoid `let`. Write `let end = 0`, not `const end = { value: 0 }`, even when a closure captures it.
- Use arrow functions and kebab-case file names. Keep classes where the code has them, mostly in hot solver and checker code.
- Avoid `any`. Use `unknown` for input that isn't parsed yet.
- Avoid `as` unless necessary. Narrow with a discriminant, `in`, `typeof`, `instanceof`, or a type guard that verifies its claim. Prefer `satisfies` or a generic argument to a cast. Do not use `!`.
- Never use star imports or alias imports, such as `import { resolve as pathResolve }`.
- Omit file extensions in relative imports: `./core`, not `./core.js`. Use `import type` for type-only imports.
- Use pnpm for project scripts. They bundle with Bun and run with Node, through `scripts/run.ts`. Never run provers, conformance or benchmarks under Bun, which runs the SMT solver about 85 times slower. Do not add tsx.
- Use TypeScript interfaces over types. Keep them at module scope. Use `type` only for unions, tuples and function signatures. Make an inline object type an interface when it appears twice or in an exported signature.
- Model variants as a discriminated union with a `kind` field, not as optional fields whose presence depends on the kind. Shape types so an illegal state can't be built.
- Rely on type inference. Add annotations only for exports.
- Do not extract single-use helpers or variables. Inline them at the call site unless the helper is reused, hides a complex boundary, or has a name that clarifies the caller.
- Avoid `try`/`catch` where possible. Remove a `catch` that only rethrows.
- Use descriptive names. Avoid one or two character names, including loop indices and callback parameters.
  - In `.map()`, use `innerX` instead of `x`.
  - Use `isMoved` instead of `moved`. Start booleans with `is`, `has`, `should` or `did`.
  - Use `get`, `set`, and `use` prefixes. Start every function name with a verb.
  - Name an unused parameter `_value` or `_index`, not `_`.
- Use dot notation instead of destructuring, so `obj.a` keeps its context. Destructuring a tuple that a call returns, and `for (const [key, value] of map)`, are fine. Never destructure parameters.

## Structure

- Group code by feature, such as `src/sany` or `src/prover/smt`, not by layer.
- Prefer fewer folders. Split a large file into files next to it. Create a folder only for a feature with many files, such as SANY or a prover backend.
- Split a file that mixes concerns along those concerns, as #514 did for `check.ts`, the SANY `generator.ts` and `cli/tlc.ts`.
- Keep shared logic in one module. Keep a decision such as backend order in one table, so a change touches one place.
- Do not add files that only forward, barrels, or wrappers that only pass a call through. Inline a layer that repeats the methods and arguments of the layer below it.
- Do not keep mutable state at module level, such as counters. Pass state explicitly. Derive a value instead of keeping two copies in sync.
- Validate input where it enters: CLI arguments, config files, specs and SMT-LIB scripts. Trust the types inside, and delete guards that can't fire.
- Fix the root cause. Do not hide a bad state with a guard, clamp, retry or swallowed error where it surfaced. Find what produced it, and fix every place with the same fault.
- Use a `Map` for a table keyed by names from user input. A plain object finds `constructor`, `toString` and `__proto__` on `Object.prototype`.
- Do not recurse on user input without a bound. 20,000 nested `let` terms overflowed the stack until the SMT-LIB reader used an explicit frame stack.
- Remove `export` from a name used only in its own file, unless an exported signature mentions it. The build emits declarations and fails with TS4023.
- Keep code the playground runs safe for the browser. `src/errors.ts` has no `node:` imports. The CLI imports the TypeScript compiler lazily, and `src/index.ts` doesn't export it.

## Ported code

- Mirror the upstream source function for function. Do not restructure a ported algorithm or merge functions that are separate upstream. Fix a port the way upstream does.
- Short names that mirror upstream variables may stay in dense numeric code. Elsewhere, use descriptive names, and do not rename toward terse upstream abbreviations such as `process2`.
- Treat creation order as output. SANY's node order shows in its output. In the Z3 port, creating or freeing a term changes which ids later terms reuse, and with them the search.

## Refactors

A refactor changes no output. It keeps these exactly as they are:

- String literals, messages, regexes, numbers and hash inputs
- Template string contents, such as TLA+ specs, expected output and SMT-LIB text
- Evaluation order, iteration order and the error class thrown
- The order in which objects, ids and fresh names are created
- Calls made only for a side effect, such as an id allocation or a call that throws on bad input

## Comments

Aim for zero comments. Delete a comment unless it is one of these:

- A tool directive, such as `eslint-disable` or a shebang
- `// HACK: reason` on a hack, such as a `setTimeout`
- One-line JSDoc on what `src/index.ts` exports, except on fields whose name already says it
- One line on a quirk of TLC, SANY, tlapm, Z3, Zenon, Isabelle, V8, Node or Bun that the code copies and a reader would otherwise "fix"
- An issue or spec link for a constraint the code can't express

Delete everything else, including:

- What a function, field, constant or branch is or returns
- Upstream names used as labels, such as `// decl_info::hash`, which belong in the identifier if they matter
- Notes that restate ordinary parity, such as "TLC prints X before Y"
- Banners, step narration, commented-out code, and TODOs without an issue link
- Paragraphs that justify a workaround

If a workaround needs a paragraph to justify it, fix the code. If a comment explains a vague name, rename the symbol. Do not shorten a comment that should go into a smaller one. A `\*` or `(* *)` inside a string is TLA+, not a TypeScript comment. Before you commit, check each added `//` line in the diff against this list.

## Performance

- Redesign the data instead of adding a cache: flat arrays indexed by integer id, packed bits, and ids end to end. A getter that maps an id back to an object costs more than it saves. In the SMT solver, one such shim for e-graph nodes cost 17% more instructions.
- Do not add caches. Before you remove one, grep for `Set`, `Map` and `===` uses of the cached objects, since code may rely on their identity. Keep a cache in a port when removing it changes the search, such as Z3's rewriter caches.
- Measure before you move to a structure of arrays. V8 reads an object field in cache faster than a column in a typed array, and moving e-graph nodes to columns cost 5.5% more instructions.
- Treat the checker, evaluator, SMT and SAT solvers, e-graph, rewriters, Zenon and Isabelle as hot. On a path that runs per state, term, clause or literal:
  - Add no allocation, closure, spread, `slice`, iterator or wrapper object.
  - Keep `for` loops. Do not turn them into `.map`, `.filter`, `.reduce` or `for...of`.
  - Keep a class's field order and the fields its constructor sets. Initialize a new field in the constructor.
  - Keep monomorphic calls monomorphic. Keep functions that are duplicated or inlined by hand on purpose, such as in `rewriter-tpl.ts`.
- Allocate an array at its final size when you know it. `push` and `[...a, b]` leave up to 17 slots of slack in stored values.
- Judge a perf change by instruction counts across the corpus, not a few specs. A V8 flag that saved 3.7% on 6 specs saved 0.7% on all 643 models.
- Build both sides the same way, since `pnpm build` minifies and the test setup doesn't. Run the baseline against itself first to learn the noise.

## Testing

- Avoid mocks. Use `globalThis` only when nothing else works.
- Test behavior, not implementation. Do not copy logic into tests.
- Make tests deterministic.
- Prefer specs ported from `tlaplus/Examples` and TLC's own tests over synthetic fixtures.
- Take expected values from the reference tool's output. A bug fix comes with a test that fails without it.
- Never weaken a test to make it pass. Fix the cause. A refactor never changes an assertion, expected value, title or input.
- Keep each `it` under about 1.5 s on an idle machine, because CI uses vitest's 5 s default. Split slow cases into separate `it`s instead of adding timeouts.
- Remove the temporary directories a test creates. Do not commit the `*_TTrace_*` files that test runs leave.

## Website

- Build `packages/website` from compound components. Merge class names with `cn` from `src/lib/utils.ts`.
- Run react-doctor on changed components.
