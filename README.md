# tla-ts

A TLA+ model checker in TypeScript, **2× faster than TLC**.

tla-ts checks TLA+ specs with the same verdicts, error traces, and state counts as TLC. It runs in Node and in the browser without a JVM.

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

result.status; // "invariant-violation"
```

> [!WARNING]
> tla-ts is in early development. Unsupported features throw `TlaUnsupportedError`: `VIEW`, `POSTCONDITION`, nested modules, `INSTANCE` inside `LET`, subexpression references such as `F(2)!3`, `TLCGet`, `TLCSet`, and the Bags and Reals modules.

## Install

```shell
npm install tla-ts
```

## Usage

### Command line

```shell
npx tla-ts Spec.tla
npx tla-ts Spec.tla -config Other.cfg -deadlock
```

Without `-config`, tla-ts reads the `.cfg` file next to the spec. `-deadlock` turns off deadlock checking. Output and exit codes follow TLC:

| Exit code | Meaning                      |
| --------: | ---------------------------- |
|         0 | No error found               |
|        10 | An assumption is false       |
|        11 | Deadlock                     |
|        12 | Invariant or property broken |
|        13 | Liveness violation           |

### API

`check` returns `status`, `violation` with its trace, and the `generatedStates`, `distinctStates`, and `depth` counts. To extend modules other than the standard modules, pass `loadModule`, which maps a module name to its source.

| Export        | Purpose                                                                             |
| ------------- | ----------------------------------------------------------------------------------- |
| `check`       | Checks a spec against a TLC configuration                                           |
| `parseModule` | Parses a TLA+ module                                                                |
| `parseConfig` | Parses a TLC configuration file                                                     |
| `formatValue` | Prints a value in TLA+ syntax                                                       |
| `TlaError`    | Base class of the syntax, configuration, evaluation, and unsupported-feature errors |

## Supported features

- **Standard modules**: Naturals, Integers, Sequences, FiniteSets, and TLC
- **Modules**: `EXTENDS`, and `INSTANCE` with `WITH` substitutions, named instances, and parameterized instances
- **Configuration**: `INIT`, `NEXT`, `SPECIFICATION`, `CONSTANTS`, `INVARIANTS`, `PROPERTIES`, `CONSTRAINTS`, `ACTION_CONSTRAINTS`, `SYMMETRY`, and `CHECK_DEADLOCK`
- **Properties**: invariants, `[][A]_v`, and the liveness forms `<>P`, `[]<>P`, `<>[]P`, `P ~> Q`, `<><<A>>_v`, and `[]<><<A>>_v` under `WF` and `SF` fairness
- **TLC semantics**: 32-bit integer overflow errors, `ENABLED`, and TLC's enumeration order for `CHOOSE` and quantifiers

## Development

```shell
pnpm install
pnpm test
pnpm dev
```

`pnpm dev` starts the playground in `packages/website`.

Run the conformance suite against TLC's recorded results:

```shell
pnpm --filter tla-ts conformance:fetch
pnpm --filter tla-ts conformance
```

Rerun the benchmarks with `TLA2TOOLS_JAR` set to the path of `tla2tools.jar`:

```shell
pnpm --filter tla-ts bench
pnpm --filter tla-ts bench:corpus
```

## Benchmarks

Wall time on one worker, including JVM and Node startup. Both checkers report the same state counts on every model.

| Spec                                                           | Distinct states |     TLC |  tla-ts | Speedup |
| -------------------------------------------------------------- | --------------: | ------: | ------: | ------: |
| [Two-phase commit](packages/tla-ts/benchmarks/commit)          |         282,251 |  4.49 s |  2.65 s |    1.7× |
| [Dining philosophers](packages/tla-ts/benchmarks/philosophers) |         128,889 |  1.67 s |  1.08 s |    1.5× |
| [Bounded queue](packages/tla-ts/benchmarks/queue)              |          44,044 |  0.68 s |  0.22 s |    3.1× |
| 390 conformance models                                         |                 | 251.3 s | 119.6 s |    2.1× |

The conformance models come from [tlaplus/Examples](https://github.com/tlaplus/Examples), TLC's test suite, [Spectacle](https://github.com/will62794/tla-web), and [tla-rs](https://github.com/fabracht/tla-rs).

## License

MIT
