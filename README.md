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

Flags:

- `-config <file>`: the TLC configuration. Defaults to the `.cfg` file next to the spec with the same name.
- `-deadlock`: turns off deadlock checking.
- `-lncheck final`: checks liveness once, on the complete state graph.
- `-seed <number>`: seeds `RandomElement` and the Randomization module. Defaults to 0.
- `-workers <count>`: the number of worker threads. Defaults to 1. `auto` starts one per core.

A compiled Java class next to the spec, named `<Module>.class`, overrides that module's operators.

Output and exit codes follow TLC:

| Exit code | Meaning                                                          |
| --------: | ---------------------------------------------------------------- |
|         0 | No error found                                                   |
|        10 | An assumption is false                                           |
|        11 | Deadlock                                                         |
|        12 | An invariant or property is violated                             |
|        13 | A temporal property or action property is violated               |
|        14 | `Assert` failed while computing next states                      |
|        75 | Evaluating the spec failed                                       |
|        76 | Evaluating an invariant failed                                   |
|       150 | The spec doesn't parse                                           |
|       151 | The configuration doesn't parse or doesn't exist                 |
|       255 | Another error, such as a failure to evaluate a liveness property |

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

#### Options

- `source`: the TLA+ module to check.
- `config`: a TLC configuration, as source text or as the result of `parseConfig`.
- `loadModule`: returns the source of a module that isn't a standard module.
- `loadClass`: returns the bytes of a compiled Java class that overrides a module's operators, as TLC's module overrides do. tla-ts runs overrides that return a constant `BoolValue`, `IntValue`, or `StringValue`.
- `onPrint`: receives the output of `Print` and `PrintT`. Defaults to `console.log`.
- `onPause`: runs when `TLCSet("pause", TRUE)` pauses checking. Checking resumes when it returns. The CLI waits for a line on standard input, as TLC does.
- `readFile` and `writeFile`: read and write files for the Json module, as TLC does from its working directory. Without `readFile`, `JsonDeserialize` fails as if the file were missing. Without `writeFile`, `JsonSerialize` writes nothing and returns `TRUE`, so a spec that exports traces checks the same way in the browser.
- `seed`: a `bigint` that seeds `RandomElement` and the Randomization module. Defaults to `0n`. tla-ts makes the same choices as TLC run with the same `-seed` and `-fp 0`.
- `workers`: the number of worker threads. Defaults to 1, which checks on the calling thread.

#### Result

`check` resolves to an object with these fields:

- `status`: how the check ended, from the table below.
- `violation`: what failed and the trace that reaches it.
- `failure`: the message, trace, and exit code of an evaluation error.
- `generatedStates`, `distinctStates`, and `depth`: the state counts TLC reports.

| `status`                    | Meaning                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `"success"`                 | No error found                                                   |
| `"assumption-violation"`    | An assumption is false                                           |
| `"deadlock"`                | A reachable state has no successor                               |
| `"invariant-violation"`     | An invariant is violated                                         |
| `"property-violation"`      | A property is violated                                           |
| `"liveness-violation"`      | A temporal property or action property is violated               |
| `"postcondition-violation"` | A `POSTCONDITION` is false or a `_POSSIBLE` predicate never held |
| `"error"`                   | Evaluation failed, and `failure` holds the error                 |

`violation` has these fields:

- `name`: the name of what failed.
- `trace`: the steps that reach the failure. Each step's `state` maps variable names to values. With `ALIAS` in the configuration, `state` holds the alias record instead, as TLC prints it. If the alias fails to evaluate, `state` holds the variables and an `_ALIASEvalError` field with the error message.
- `loopStart`: for a liveness violation, the trace index where the lasso loops back.
- `unwitnessed`: the first `_POSSIBLE` predicate that never held. As TLC does, `check` still checks `_POSSIBLE` after any violation except a false assumption, and keeps the original `status`.
- `counts`: for a `_POSSIBLE` failure, the record of witness counts that TLC prints before the error. The CLI prints it there instead of passing it to `onPrint`.

#### Workers

Workers run in Node, Bun, Deno, and the browser. They deduplicate states by 64-bit fingerprint, as TLC does. `check` falls back to the calling thread, and returns its exact result and trace, in these cases:

- The run finds a violation.
- The spec has liveness properties.
- The spec uses an impure operator such as `Print`.

#### Supported features

- **Standard modules**: Naturals, Integers, Sequences, FiniteSets, TLC, Bags, Reals, RealTime, and Toolbox.
- **Community modules**: TLCExt, Json, and Randomization.
- **Modules**: `EXTENDS`, nested modules, and `INSTANCE` with `WITH` substitutions. Instances can be named, parameterized, or inside `LET`. `LAMBDA` expressions, operator names, and operator symbols such as `+` can be substituted for operator parameters.
- **Configuration**: `INIT`, `NEXT`, `SPECIFICATION`, `CONSTANTS`, `INVARIANTS`, `PROPERTIES`, `CONSTRAINTS`, `ACTION_CONSTRAINTS`, `SYMMETRY`, `VIEW`, `ALIAS`, `POSTCONDITION`, `CHECK_DEADLOCK`, and `_POSSIBLE` properties.
- **Constants**: plain values, operator constants assigned through `<-`, and tables such as `F(1) = 2`.
- **Postconditions**: after a violation, tla-ts still checks `POSTCONDITION`, with TLCExt's `CounterExample` bound to the violating behavior. The result keeps the status of the violation.
- **Properties**: invariants, `[][A]_v`, and every temporal formula TLC accepts. tla-ts checks them through TLC's tableau construction, under the fairness and temporal conjuncts of the specification.
- **Subexpression references**: selectors such as `F(2)!3`, `Op!<<`, `Op!>>`, `Op!:`, `Op!@`, and `Op!(x)`, labels such as `Op!lab`, and names of `THEOREM` formulas.
- **TLC semantics**:
  - 32-bit integer overflow errors.
  - `ENABLED`.
  - `TLCGet` and `TLCSet`, with TLC's counters, registers, and `TLCGet("spec")` record.
  - TLC's enumeration order for `CHOOSE` and quantifiers.
- **`STRING`, `Nat`, `Int`, and `Seq(S)`**: TLC has no Strings module, so `STRING` is built in, as in TLC's Java `Strings` class. These sets compare only with each other and with model values, as in TLC's Java classes. Comparing one with any other set is an error.

`check` accepts `_PERIODIC` and `_RL_REWARD` but doesn't evaluate them. Like TLC, it requires each to name an operator without arguments. TLC evaluates `_PERIODIC` on its progress interval, 60 s by default, and `_RL_REWARD` only in its reinforcement learning simulation mode.

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
