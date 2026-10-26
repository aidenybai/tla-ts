# tla-ts

[![version](https://img.shields.io/npm/v/tla-ts?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)
[![downloads](https://img.shields.io/npm/dt/tla-ts.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)

A TLA+ model checker in TypeScript, **2× faster than TLC**.

tla-ts checks TLA+ specs with the same verdicts, error traces, and state counts as TLC. It runs in Node and in the browser without a JVM. Try it in the [playground](https://tla-ts.aidenybai.com).

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
| `defineSpec`  | Builds a spec and its configuration in TypeScript                                   |
| `parseModule` | Parses a TLA+ module                                                                |
| `parseConfig` | Parses a TLC configuration file                                                     |
| `formatValue` | Prints a value in TLA+ syntax                                                       |
| `TlaError`    | Base class of the syntax, configuration, evaluation, and unsupported-feature errors |

### TypeScript specs

`defineSpec` builds the same syntax tree as the parser, so a TypeScript spec gets TLC's semantics, traces, and state counts. The object it returns also replaces the configuration file:

```ts
import { check, defineSpec } from "tla-ts";

const counter = defineSpec((tla) => {
  const limit = tla.constant("Limit", 3);
  const count = tla.variable("count");
  const increment = tla.define(
    "Increment",
    tla.and(count.lt(limit), count.prime().eq(count.plus(1))),
  );
  return {
    init: count.eq(0),
    next: increment,
    fairness: [tla.weakFairness(increment)],
    properties: { Done: tla.eventually(count.eq(limit)) },
    checkDeadlock: false,
  };
});

check({ spec: counter }).status; // "success"
```

- `tla.variable` and `tla.constant` declare names. A constant takes a number, string, boolean, `tla.modelValue(name)`, or an array, which becomes a set.
- `tla.define` and `tla.operator` add named definitions. Named actions appear in error traces. Operators can call themselves.
- Terms have methods for relations, arithmetic, sets, functions, records, and sequences, such as `eq`, `plus`, `in`, `union`, `at`, `except`, and `append`.
- `tla.forall`, `tla.exists`, `tla.choose`, `tla.filter`, `tla.map`, and `tla.fn` take a callback that receives the bound variables.
- `tla.call` applies any other standard operator by name, such as `tla.call("Permutations", procs)`.
- The return value sets `init`, `next`, `fairness`, `invariants`, `properties`, `constraints`, `actionConstraints`, `symmetry`, and `checkDeadlock`. Each record key names a definition.

Every TypeScript spec extends Integers, Sequences, FiniteSets, and TLC. The builder does not support `LET`, `\X`, `LAMBDA`, unbounded quantifiers, or `INSTANCE`. Use a TypeScript function in place of `LET`.

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

## License

MIT
