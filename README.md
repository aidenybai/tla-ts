# tla-ts

[![version](https://img.shields.io/npm/v/tla-ts?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)
[![downloads](https://img.shields.io/npm/dt/tla-ts.svg?style=flat&colorA=000000&colorB=000000)](https://npmjs.com/package/tla-ts)

tla-ts formally verifies your TypeScript code with [TLA+](https://lamport.azurewebsites.net/tla/tla.html).

[View playground](https://tla-ts.aidenybai.com)

## How it works

1. Run `npx tla-ts [file].ts`.
2. tla-ts transpiles TypeScript into TLA+.
3. tla-ts model checks TypeScript code and finds violations.

Here, tla-ts checks a counter:

```ts
// counter.ts
let count = 0;

export const increment = () => {
  count += 1;
};

export const small = () => count < 3;
```

tla-ts transpiles it into this TLA+ module:

```tla
---- MODULE Counter ----
EXTENDS Integers, Sequences, FiniteSets, TLC
VARIABLES count
vars == <<count>>
Init == count = 0
increment == count' = count + 1
Next == increment
Spec == /\ Init
        /\ [][Next]_vars
small == count < 3 \* violated after three calls to increment
====
```

## Install

```shell
npm install tla-ts
```

You can also skip the install and run `npx tla-ts [file].ts`.

## About

tla-ts is a research project by [Aiden Bai](https://aidenybai.com).

Under the hood, tla-ts is a transpiler that turns TypeScript/JavaScript into TLA+. It uses a 1:1 reimplementation of [TLC](https://github.com/tlaplus/tlaplus)/[TLAPM](https://proofs.tlapl.us) in TypeScript that runs 2× faster.

Wall time on one worker, including JVM and Node startup. Both checkers report the same state counts on every model.

| Spec                                                           | Distinct states |     TLC |  tla-ts | Speedup |
| -------------------------------------------------------------- | --------------: | ------: | ------: | ------: |
| [Two-phase commit](packages/tla-ts/benchmarks/commit)          |         282,251 |  4.32 s |  2.01 s |    2.2× |
| [Dining philosophers](packages/tla-ts/benchmarks/philosophers) |         128,889 |  1.06 s |  0.71 s |    1.5× |
| [Bounded queue](packages/tla-ts/benchmarks/queue)              |          44,044 |  0.37 s |  0.17 s |    2.2× |
| 542 conformance models                                         |                 | 986.6 s | 403.3 s |    2.4× |

Wall time on 8 workers, also including startup. Each time is the median of 3 runs on an Apple M4 Pro.

| Spec                                                                                                                  | Distinct states |     TLC | tla-ts | Speedup |
| --------------------------------------------------------------------------------------------------------------------- | --------------: | ------: | -----: | ------: |
| [Raft with reconfiguration](https://github.com/will62794/tla-web/blob/8193eb0/specs/RaftWithReconfigSingleServer.tla) |         298,493 | 10.50 s | 8.96 s |    1.2× |
| [Sailfish](https://github.com/tlaplus/Examples/tree/0cab2b3/specifications/dag-consensus)                             |         109,604 |  4.34 s | 4.07 s |    1.1× |
| [Fast Paxos](https://github.com/tlaplus/Examples/tree/0cab2b3/specifications/SimplifiedFastPaxos)                     |          25,617 |  3.91 s | 2.57 s |    1.5× |
| [Buffered random access file](https://github.com/tlaplus/Examples/tree/0cab2b3/specifications/braf)                   |           3,316 |  4.70 s | 3.61 s |    1.3× |

tla-ts currently maintains 32.32% conformance with [test262](https://github.com/tc39/test262) (17,372 / 53,755 passing).

## API

### `check`

```ts
const result = await check({ source, config });
result.status; // "success", "deadlock", "invariant-violation", ...
result.violation?.trace;
```

| Option       | Description                                 |
| ------------ | ------------------------------------------- |
| `source`     | The TLA+ module                             |
| `config`     | A TLC configuration                         |
| `loadModule` | Returns the source of an imported module    |
| `workers`    | The number of worker threads. Defaults to 1 |

### `prove`

```ts
const result = await prove({ source });
result.obligations; // each with a status: "proved", "trivial", "failed", or "unsupported"
```

| Option         | Description                                      |
| -------------- | ------------------------------------------------ |
| `source`       | The TLA+ module                                  |
| `loadModule`   | Returns the source of an imported module         |
| `onObligation` | Receives each obligation as soon as it's decided |
| `workers`      | The number of worker threads. Defaults to 1      |

### `parseModule`

```ts
const module = parseModule(source);
module.name; // "Spec"
module.definitions;
```

### `parseConfig`

```ts
const config = parseConfig(configSource);
config.invariants.push("TypeOK");
await check({ source, config });
```

### `formatValue`

```ts
const step = result.violation.trace[0];
formatValue(step.state.queue); // "<<1, 2>>"
```

### Errors

| Error                 | Thrown when                                     |
| --------------------- | ----------------------------------------------- |
| `TlaError`            | Any of the errors below                         |
| `TlaSyntaxError`      | The module doesn't parse                        |
| `TlaConfigError`      | The configuration is invalid                    |
| `TlaEvaluationError`  | Evaluating the spec fails                       |
| `TlaUnsupportedError` | The spec or call uses something tla-ts can't do |

## Development

```shell
pnpm install
pnpm test
pnpm dev
```

`pnpm dev` starts the website in `packages/website`.

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
