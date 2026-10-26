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
- `tla.define` adds a named definition. `tla.operator(name, params, body)` adds an operator, such as `tla.operator("Send", ["item"], (item) => ...)`. Named actions appear in error traces.
- A parameter such as `"F(_)"` takes an operator. Pass it a `tla.lambda` or the function that `tla.operator` returns.
- `tla.function(name, sets, body)` defines a recursive function, such as `Fib[n \in Nat] == ...`.
- Terms have methods for the standard operators, such as `eq`, `plus`, `in`, `union`, `at`, `except`, `append`, `selectSeq`, and `permutations`.
- `tla.forall`, `tla.exists`, `tla.fn`, and `tla.map` take a set, or an array of sets for several bound variables, and a callback that receives the bound variables. `tla.choose` and `tla.filter` take one set.
- `tla.unboundedForall`, `tla.unboundedExists`, and `tla.unboundedChoose` take only a callback. TLC cannot evaluate them, so they throw `TlaEvaluationError` like TLC does.
- `tla.let(value, (name) => body)` and `tla.letOperator(params, definition, (operator) => body)` build `LET`. The definition callback receives the operator after its parameters, so it can call itself.
- `tla.product` builds `\X`, and `tla.lambda(params, body)` builds `LAMBDA`.
- `tla.instance(name, module, substitutions)` instantiates a module from `loadModule` and returns a function that applies its operators, such as `channel("Send", item)`. `tla.parameterizedInstance(name, params, module, getSubstitutions)` adds instance parameters, such as `pair(right)("TypeOK")`. `tla.unnamedInstance(module, substitutions)` adds the module's definitions without a prefix.
- The return value sets `init`, `next`, `fairness`, `invariants`, `properties`, `constraints`, `actionConstraints`, `symmetry`, `assumptions`, and `checkDeadlock`. Each record key names a definition.

TypeScript checks the number of bound variables and operator arguments. A recursive operator or function needs a return type on its callback, such as `(n): Term => ...`. A TypeScript spec extends only the standard modules that it uses. Error messages point to the line and column in the TypeScript file that built the failing expression.

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
