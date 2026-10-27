# tla-ts

[![version](https://img.shields.io/npm/v/tla-ts?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)
[![downloads](https://img.shields.io/npm/dt/tla-ts.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)

A TLA+ model checker in TypeScript, **2.4× faster than TLC**.

tla-ts checks TLA+ specs with the same verdicts, error traces, and state counts as TLC. It runs in Node and in the browser without a JVM. Try it in the [playground](https://tla-ts.aidenybai.com).

```ts
import { check } from "tla-ts";

const result = await check({
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

## Install

```shell
npm install tla-ts
```

## Usage

```shell
npx tla-ts Spec.tla
npx tla-ts Spec.tla -config Other.cfg -deadlock
npx tla-ts Spec.tla -workers auto
npx tla-ts Spec.tla -seed 42
```

Without `-config`, tla-ts reads the `.cfg` file next to the spec. `-deadlock` turns off deadlock checking. `-seed` sets the seed of `RandomElement` and the Randomization module, which defaults to 0. `-workers` checks on several threads, one per core with `auto`. Output and exit codes follow TLC:

| Exit code | Meaning                      |
| --------: | ---------------------------- |
|         0 | No error found               |
|        10 | An assumption is false       |
|        11 | Deadlock                     |
|        12 | Invariant or property broken |
|        13 | Liveness violation           |

## API reference

### `check`

Checks a spec against a TLC configuration and resolves to the result. It explores every reachable state breadth-first, as TLC does.

```ts
import { check } from "tla-ts";

const result = await check({
  source: specSource,
  config: configSource,
  loadModule: (name) => modules[name],
  onPrint: (text) => console.log(text),
});
```

Options:

- `source`: the TLA+ module to check
- `config`: a TLC configuration, as source text or as the result of `parseConfig`
- `loadModule`: maps a module name to its source, for modules other than the standard modules
- `onPrint`: receives the output of `Print` and `PrintT`, which defaults to `console.log`
- `onPause`: runs when `TLCSet("pause", TRUE)` pauses checking, and checking resumes when it returns. The CLI waits for a line on standard input, as TLC does
- `readFile` and `writeFile`: let the Json module read and write files, as TLC does from its working directory. Without `readFile`, `JsonDeserialize` fails as if the file were missing. Without `writeFile`, `JsonSerialize` writes nothing and still returns `TRUE`, so a spec that exports traces checks the same way in the browser
- `seed`: a `bigint` that seeds `RandomElement` and the Randomization module, which defaults to `0n`. tla-ts makes the same choices as TLC run with `-seed` set to the same value and `-fp 0`
- `workers`: the number of worker threads to check on, which defaults to 1. With 1, `check` runs on the calling thread

The result has `status`, `violation`, `generatedStates`, `distinctStates`, and `depth`. `status` is `"success"`, `"assumption-violation"`, `"invariant-violation"`, `"property-violation"`, `"liveness-violation"`, `"postcondition-violation"`, or `"deadlock"`. A `"postcondition-violation"` means a `POSTCONDITION` is false or a `_POSSIBLE` predicate never held during the search. After any other violation except a false assumption, `check` still checks `_POSSIBLE`, as TLC does, and sets `violation.unwitnessed` to the first predicate that never held without changing `status`. A `_POSSIBLE` failure's `counts` holds the record of witness counts that TLC prints before the error, and the CLI prints it there instead of passing it to `onPrint`. `violation` holds the name of what failed and the trace that reaches it. For a liveness violation, `violation.loopStart` is the trace index where the lasso loops back. With `ALIAS` in the configuration, each trace step's `state` holds the alias record instead of the variables, as TLC prints it. If the alias fails to evaluate, `state` holds the variables plus an `_ALIASEvalError` field with the error message.

Workers run in Node, Bun, Deno, and the browser, and deduplicate states by 64-bit fingerprint, as TLC does. When a run finds a violation, or the spec uses liveness properties or impure operators such as `Print`, `check` falls back to the calling thread and returns its exact result and trace.

`check` supports:

- **Standard modules**: Naturals, Integers, Sequences, FiniteSets, TLC, Bags, Reals, RealTime, Toolbox, and the community modules TLCExt, Json, and Randomization
- **Modules**: `EXTENDS`, nested modules, and `INSTANCE` with `WITH` substitutions, `LAMBDA` substitutions for operator parameters, named instances, parameterized instances, and instances inside `LET`
- **Configuration**: `INIT`, `NEXT`, `SPECIFICATION`, `CONSTANTS`, `INVARIANTS`, `PROPERTIES`, `CONSTRAINTS`, `ACTION_CONSTRAINTS`, `SYMMETRY`, `VIEW`, `ALIAS`, `POSTCONDITION`, `CHECK_DEADLOCK`, and `_POSSIBLE` properties
- **Properties**: invariants, `[][A]_v`, and every temporal formula TLC accepts, checked through TLC's tableau construction under the fairness and temporal conjuncts of the specification
- **Subexpression references**: selectors such as `F(2)!3`, `Op!<<`, `Op!>>`, `Op!:`, `Op!@`, and `Op!(x)`, labels such as `Op!lab`, and names of `THEOREM` formulas
- **TLC semantics**: 32-bit integer overflow errors, `ENABLED`, `TLCGet` and `TLCSet` with TLC's counters and registers, and TLC's enumeration order for `CHOOSE` and quantifiers
- **`STRING`, `Nat`, `Int`, and `Seq(S)`**: TLC has no Strings module. `STRING` is built in, as TLC's Java `Strings` class implements it. These sets compare only with each other and with model values, as in TLC's Java classes, and comparing one with any other set is an error

`check` also accepts `_PERIODIC` and `_RL_REWARD` and, like TLC, requires each to name an operator without arguments. It does not evaluate them. TLC evaluates `_PERIODIC` on its progress interval, which is 60 seconds by default, and `_RL_REWARD` only in its reinforcement learning simulation mode.

### `parseModule`

Parses a TLA+ module into its syntax tree. Throws `TlaSyntaxError` on invalid input.

```ts
import { parseModule } from "tla-ts";

const module = parseModule(specSource);
module.name; // "Counter"
```

### `parseConfig`

Parses a TLC configuration file into a `ModelConfig`. Pass the result to `check` to change it before checking.

```ts
import { check, parseConfig } from "tla-ts";

const config = parseConfig(configSource);
config.checkDeadlock = false;
await check({ source: specSource, config });
```

### `formatValue`

Prints a value in TLA+ syntax, as TLC prints it in traces.

```ts
import { formatValue } from "tla-ts";

result.violation?.trace.forEach((step) => {
  Object.entries(step.state).forEach(([name, value]) => console.log(name, formatValue(value)));
});
```

### Errors

Every error extends `TlaError`:

- `TlaSyntaxError`: the module does not parse
- `TlaConfigError`: the configuration is invalid or refers to an unknown name
- `TlaEvaluationError`: evaluation failed, as when TLC reports an error
- `TlaUnsupportedError`: the spec uses a feature tla-ts does not support yet

## Benchmarks

Wall time on one worker, including JVM and Node startup. Both checkers report the same state counts on every model.

| Spec                                                           | Distinct states |     TLC |  tla-ts | Speedup |
| -------------------------------------------------------------- | --------------: | ------: | ------: | ------: |
| [Two-phase commit](packages/tla-ts/benchmarks/commit)          |         282,251 |  4.32 s |  2.01 s |    2.2× |
| [Dining philosophers](packages/tla-ts/benchmarks/philosophers) |         128,889 |  1.06 s |  0.71 s |    1.5× |
| [Bounded queue](packages/tla-ts/benchmarks/queue)              |          44,044 |  0.37 s |  0.17 s |    2.2× |
| 542 conformance models                                         |                 | 986.6 s | 403.3 s |    2.4× |

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

## License

MIT
