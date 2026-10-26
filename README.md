# tla-ts

[![version](https://img.shields.io/npm/v/tla-ts?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)
[![downloads](https://img.shields.io/npm/dt/tla-ts.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)

A TLA+ model checker in TypeScript, **2.9× faster than TLC**.

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
> tla-ts is in early development. Unsupported features throw `TlaUnsupportedError`: `VIEW`, `POSTCONDITION`, `TLCGet("spec")`, `TLCGet("revision")`, and the Bags and Reals modules.

## Install

```shell
npm install tla-ts
```

## Usage

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

## API reference

### `check`

Checks a spec against a TLC configuration and returns the result. It explores every reachable state breadth-first, as TLC does.

```ts
import { check } from "tla-ts";

const result = check({
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

The result has `status`, `violation`, `generatedStates`, `distinctStates`, and `depth`. `status` is `"success"`, `"assumption-violation"`, `"invariant-violation"`, `"property-violation"`, `"liveness-violation"`, or `"deadlock"`. `violation` holds the name of what failed and the trace that reaches it. For a liveness violation, `violation.loopStart` is the trace index where the lasso loops back.

`check` supports:

- **Standard modules**: Naturals, Integers, Sequences, FiniteSets, and TLC
- **Modules**: `EXTENDS`, nested modules, and `INSTANCE` with `WITH` substitutions, `LAMBDA` substitutions for operator parameters, named instances, parameterized instances, and instances inside `LET`
- **Configuration**: `INIT`, `NEXT`, `SPECIFICATION`, `CONSTANTS`, `INVARIANTS`, `PROPERTIES`, `CONSTRAINTS`, `ACTION_CONSTRAINTS`, `SYMMETRY`, and `CHECK_DEADLOCK`
- **Properties**: invariants, `[][A]_v`, and every temporal formula TLC accepts, checked through TLC's tableau construction under the fairness and temporal conjuncts of the specification
- **Subexpression references**: selectors such as `F(2)!3`, `Op!<<`, `Op!>>`, `Op!:`, `Op!@`, and `Op!(x)`, labels such as `Op!lab`, and names of `THEOREM` formulas
- **TLC semantics**: 32-bit integer overflow errors, `ENABLED`, and TLC's enumeration order for `CHOOSE` and quantifiers

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
check({ source: specSource, config });
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

| Spec                                                           | Distinct states |     TLC | tla-ts | Speedup |
| -------------------------------------------------------------- | --------------: | ------: | -----: | ------: |
| [Two-phase commit](packages/tla-ts/benchmarks/commit)          |         282,251 |  4.49 s | 2.65 s |    1.7× |
| [Dining philosophers](packages/tla-ts/benchmarks/philosophers) |         128,889 |  1.67 s | 1.08 s |    1.5× |
| [Bounded queue](packages/tla-ts/benchmarks/queue)              |          44,044 |  0.68 s | 0.22 s |    3.1× |
| 389 conformance models                                         |                 | 280.7 s | 96.7 s |    2.9× |

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
