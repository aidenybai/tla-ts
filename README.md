# tla-ts

A TLA+ interpreter and model checker in TypeScript, no JVM required.

tla-ts parses a TLA+ module and a TLC configuration file, then explores every reachable state breadth-first, the way TLC does. It reports the same verdicts, error traces, and state counts as TLC, and it runs in Node and in the browser.

> [!WARNING]
> tla-ts is in early development. It checks safety properties only. Liveness properties, `INSTANCE`, and `ENABLED` throw `TlaUnsupportedError`.

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
import { check, formatValue } from "tla-ts";

const source = `
---- MODULE Clock ----
EXTENDS Naturals

VARIABLE hour

Init == hour = 1

Next == hour' = IF hour = 12 THEN 1 ELSE hour + 1

BeforeMidnight == hour < 12
====
`;

const config = `
INIT Init
NEXT Next
INVARIANT BeforeMidnight
`;

const result = check({ source, config });

console.log(result.status); // "invariant-violation"
console.log(result.violation?.name); // "BeforeMidnight"
for (const step of result.violation?.trace ?? []) {
  console.log(step.action ?? "Init", formatValue(step.state.hour)); // "Init 1", "Next 2", …, "Next 12"
}
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
- **Configuration**: `INIT`, `NEXT`, `SPECIFICATION`, `CONSTANTS` with model values and `<-` substitutions, `INVARIANTS`, `PROPERTIES` of the form `[]P` and `[][A]_v`, `CONSTRAINTS`, `ACTION_CONSTRAINTS`, and `CHECK_DEADLOCK`.
- **TLC semantics**: 32-bit integers with overflow errors, call-by-name operator arguments, TLC's enumeration order for `CHOOSE` and quantifiers, and TLC's rules for comparing values of different kinds.

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

`pnpm --filter tla-ts bench` runs each spec in `packages/tla-ts/benchmarks` with TLC and with tla-ts on one worker, and checks that both report the same state counts. It needs `TLA2TOOLS_JAR`.

## License

tla-ts is [MIT-licensed](LICENSE).
