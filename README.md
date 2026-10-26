# tla-ts

A TLA+ interpreter and model checker in TypeScript, **2× faster than TLC**.

tla-ts parses a TLA+ module and a TLC configuration file, then explores every reachable state breadth-first, the way TLC does. It reports the same verdicts, error traces, and state counts as TLC, and it runs in Node and in the browser without a JVM.

> [!WARNING]
> tla-ts is in early development. Features it does not support yet throw `TlaUnsupportedError` instead of returning a result: `VIEW`, `POSTCONDITION`, nested modules, `INSTANCE` inside `LET`, subexpression references such as `F(2)!3`, `TLCGet`, `TLCSet`, and the Bags and Reals modules.

## Install

```shell
npm install tla-ts
```

## Run from the command line

```shell
npx tla-ts Spec.tla
npx tla-ts Spec.tla -config Other.cfg -deadlock
```

Without `-config`, tla-ts reads the `.cfg` file next to the spec. `-deadlock` turns off deadlock checking, as in TLC. The output and exit codes follow TLC: 0 when no error is found, 10 for a false assumption, 11 for a deadlock, and 12 for a safety violation.

## Run from code

```ts
import { check } from "tla-ts";

const result = check({
  source: `---- MODULE Counter ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = x + 1
Small == x < 3
====`,
  config: "INIT Init NEXT Next INVARIANT Small",
});

console.log(result.status, result.violation?.trace.length); // "invariant-violation" 4
```

`check` returns the status, the violation and its trace, and the generated, distinct, and depth counts. When the spec extends a module other than the standard modules, pass `loadModule`, which takes a module name and returns its source.

| Export                    | Purpose                                                           |
| ------------------------- | ----------------------------------------------------------------- |
| `check`                   | Checks a spec against a configuration                             |
| `parseModule`             | Parses a TLA+ module                                              |
| `parseConfig`             | Parses a TLC configuration file                                   |
| `formatValue`             | Prints a value in TLA+ syntax                                     |
| `TlaError` and subclasses | Syntax, configuration, evaluation, and unsupported-feature errors |

## What it supports

- **Standard modules**: Naturals, Integers, Sequences, FiniteSets, and TLC.
- **Modules**: `EXTENDS`, and `INSTANCE` with `WITH` substitutions, named instances such as `N == INSTANCE M`, and parameterized instances such as `N(p) == INSTANCE M`.
- **Configuration**: `INIT`, `NEXT`, `SPECIFICATION`, `CONSTANTS` with model values and `<-` substitutions, `INVARIANTS`, `PROPERTIES`, `CONSTRAINTS`, `ACTION_CONSTRAINTS`, `SYMMETRY`, and `CHECK_DEADLOCK`.
- **Properties**: invariants `[]P`, action properties `[][A]_v`, and the liveness forms `<>P`, `[]<>P`, `<>[]P`, `P ~> Q`, `<><<A>>_v`, and `[]<><<A>>_v`, including quantified ones. Liveness is checked under the spec's `WF` and `SF` fairness conditions, and a violation reports a lasso.
- **TLC semantics**: 32-bit integers with overflow errors, call-by-name operator arguments, `ENABLED`, TLC's enumeration order for `CHOOSE` and quantifiers, and TLC's rules for comparing values of different kinds.

## Development

```shell
pnpm install
pnpm check
pnpm typecheck
pnpm test
pnpm dev
```

`pnpm dev` starts the website in `packages/website`, where you can edit a spec and check it in the browser.

### Conformance

The conformance suite runs tla-ts against tlaplus/Examples, TLC's own test models, Spectacle's specs, and tla-rs's specs, pinned in `packages/tla-ts/tests/conformance/corpora.json`. `expected.json` records what TLC reports for each model.

```shell
pnpm --filter tla-ts conformance:fetch
pnpm --filter tla-ts conformance
```

To record TLC's results again, set `TLA2TOOLS_JAR` to the path of `tla2tools.jar` and run `pnpm --filter tla-ts conformance:record`.

### Benchmarks

`pnpm --filter tla-ts bench` runs each spec in `packages/tla-ts/benchmarks` with TLC and with tla-ts on one worker, and checks that both report the same state counts. `pnpm --filter tla-ts bench:corpus` times both on every corpus model where tla-ts matches TLC. Across 390 models, tla-ts takes 119.6s and TLC takes 251.3s. Both need `TLA2TOOLS_JAR`.

## License

tla-ts is [MIT-licensed](LICENSE).
